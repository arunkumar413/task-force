const mongoose = require("mongoose");
const Todo = require("../models/Todo");
const Employee = require("../models/Employee");
const TaskView = require("../models/TaskView");
const { departmentOptions, fieldsForLabels, withDepartmentLabel } = require("../utils/taskDepartments");
const objectStorage = require("../utils/objectStorage");
const parseCommentFiles = require("../middlewares/commentFiles");
const { pipeline } = require("node:stream/promises");
const { uploadFiles, cleanupFiles } = require("../utils/taskFileUploads");
const Notification = require("../models/Notification");
const { syncCommentNotifications } = require("../utils/commentNotifications");
const history = require("../utils/taskHistory");

function httpError(status, message) { return Object.assign(new Error(message), { status }); }
const validId = id => typeof id === "string" && mongoose.isObjectIdOrHexString(id);

// Permission grants authorize the action; this filter limits the records it can affect.
async function taskScope(user) {
  if (user.fullAccess) return { tenantId: user.tenantId };
  const reports = await Employee.find({ tenantId: user.tenantId, ancestorManagers: user.id }).distinct("_id");
  return { tenantId: user.tenantId, $or: [
    { employee: { $in: [user.id, ...reports] } }, { createdBy: user.id },
  ] };
}
async function findTask(req) {
  if (!validId(req.params.taskId)) throw httpError(400, "Invalid task ID");
  const task = await Todo.findOne({ ...(await taskScope(req.session.user)), _id: req.params.taskId });
  if (!task) throw httpError(404, "Task not found");
  return task;
}
async function editableFields(body, user) {
  const allowed = ["title", "description", "status", "priority", "dueDate", "labels", "employee", "subtasks", "attachments"];
  const values = Object.fromEntries(allowed.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
  if (values.employee) {
    if (!validId(values.employee)) throw httpError(400, "Invalid assignee");
    const assignee = await Employee.findOne({ _id: values.employee, tenantId: user.tenantId, isActive: true });
    if (!assignee) throw httpError(400, "Assignee must be an active employee in your organization");
  }
  return values;
}
function serialize(task) {
  const value = task.toJSON();
  if (value.employee && typeof value.employee === "object" && value.employee.name) {
    value.user = value.employee.name;
    // Employee.toJSON exposes "id" and removes "_id" from populated records.
    value.employee = value.employee.id;
  }
  return value;
}
const handle = fn => async (req, res, next) => { try { await fn(req, res); } catch (err) { next(err); } };
exports.listTasks = handle(async (req, res) => {
  const tasks = await Todo.find(await taskScope(req.session.user)).populate("employee", "name").sort({ dueDate: 1 });
  res.json({ data: tasks.map(serialize) });
});
exports.getMyTasks = handle(async (req, res) => {
  const tasks = await Todo.find({ tenantId: req.session.user.tenantId, employee: req.session.user.id }).populate("employee", "name");
  res.json({ data: tasks.map(serialize) });
});
exports.getTask = handle(async (req, res) => {
  const task = await findTask(req);
  await task.populate("employee", "name");
  res.json({ data: serialize(task) });
});
exports.createTask = handle(async (req, res) => {
  if (req.is("multipart/form-data")) {
    await parseCommentFiles(req, res);
    try { req.body = JSON.parse(req.body.task); }
    catch (err) { throw httpError(400, "Invalid task data"); }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) throw httpError(400, "Invalid task data");
  }
  const user = req.session.user;
  const fields = await editableFields(req.body, user);
  if (fields.attachments) {
    if (!Array.isArray(fields.attachments) || fields.attachments.some(file => !file || typeof file !== "object")) throw httpError(400, "Invalid attachments");
    fields.attachments = fields.attachments.map(file => ({ file_name: file.file_name, link: file.link }));
  }
  Object.assign(fields, await fieldsForLabels(user.tenantId, fields.labels, user.departmentId));
  const task = new Todo({ ...fields, employee: fields.employee || user.id, tenantId: user.tenantId, createdBy: user.id });
  await task.validate();
  const uploaded = [];
  try {
    await uploadFiles(req, task.id, req.files || [], uploaded);
    task.attachments.push(...uploaded);
    task.history.push(history.event(user, "created"));
    await task.save();
  } catch (err) { await cleanupFiles(req, uploaded); throw err; }
  await task.populate("employee", "name");
  res.status(201).json({ data: serialize(task) });
});
exports.updateTask = handle(async (req, res) => {
  const task = await findTask(req);
  const before = await history.snapshot(task);
  const fields = await editableFields(req.body, req.session.user);
  if (fields.attachments) {
    if (!Array.isArray(fields.attachments) || fields.attachments.some(file => !file || typeof file !== "object")) throw httpError(400, "Invalid attachments");
    fields.attachments = fields.attachments.map(file => {
      const existing = task.attachments.find(item => String(item._id) === String(file._id));
      return existing?.storage_key ? existing.toObject() : { file_name: file.file_name, link: file.link };
    });
  }
  if (Object.hasOwn(fields, "labels")) fields.labels = withDepartmentLabel(fields.labels, task.departmentLabel);
  task.set(fields);
  await task.validate();
  const changes = history.changes(before, await history.snapshot(task));
  if (changes.length) task.history.push(history.event(req.session.user, "updated", changes));
  await task.save();
  await task.populate("employee", "name");
  res.json({ data: serialize(task) });
});
exports.deleteTask = handle(async (req, res) => {
  const task = await findTask(req);
  await task.deleteOne();
  await Notification.deleteMany({ tenantId: task.tenantId, taskId: task._id });
  res.status(204).end();
});
exports.addComment = handle(async (req, res) => {
  const task = await findTask(req);
  if (req.is("multipart/form-data")) await parseCommentFiles(req, res);
  if (typeof req.body.comment !== "string" || !req.body.comment.trim() || req.body.comment.length > 20000) throw httpError(400, "Enter a comment of up to 20000 characters");
  const user = req.session.user;
  if (req.body.attachments && (!Array.isArray(req.body.attachments) || req.body.attachments.some(file => !file || typeof file !== "object"))) throw httpError(400, "Invalid attachments");
  const links = (req.body.attachments || []).map(file => ({ file_name: file.file_name, link: file.link }));
  const comment = task.comments.create({ comment: req.body.comment, author: user.id, username: user.username, email: user.email, attachments: links });
  const validationError = comment.validateSync();
  if (validationError) throw validationError;
  const uploaded = [];
  try {
    for (const file of req.files || []) {
      const id = new mongoose.Types.ObjectId();
      const key = `${user.tenantId}/${task.id}/${comment.id}/${id}`;
      let stored;
      try { stored = await objectStorage.upload(key, file); }
      catch (err) { if (err.status === 503) throw err; throw httpError(502, "Attachment upload failed. Please try again."); }
      uploaded.push(stored);
      const base = process.env.PUBLIC_APP_URL || `${req.protocol}://${req.get("host")}`;
      comment.attachments.push({ _id: id, file_name: file.originalname.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 255) || "attachment", size: file.size, ...stored,
        link: new URL(`/api/tasks/${task.id}/comments/${comment.id}/attachments/${id}`, base).href });
    }
    const attachmentError = comment.validateSync();
    if (attachmentError) throw attachmentError;
    const commentChanges = [{ field: "comment", before: null, after: comment.comment }];
    if (comment.attachments.length) commentChanges.push({ field: "attachments", before: [], after: comment.attachments.map(item => ({ file_name: item.file_name, link: item.link })) });
    const result = await Todo.updateOne({ _id: task._id, tenantId: user.tenantId }, { $push: { comments: comment.toObject(), history: history.event(user, "commented", commentChanges) }, $inc: { __v: 1 } }, { runValidators: true });
    if (!result.matchedCount) throw httpError(404, "Task not found");
  } catch (err) {
    await Promise.all(uploaded.map(file => objectStorage.remove(file).catch(cleanupError => req.log?.error({ err: cleanupError, key: file.storage_key }, "Attachment cleanup failed"))));
    throw err;
  }
  await syncCommentNotifications(task, comment, user).catch(err => req.log?.error({ err }, "Mention notifications queued for retry"));
  const updated = await Todo.findById(task._id).populate("employee", "name");
  res.status(201).json({ data: serialize(updated) });
});
exports.updateComment = handle(async (req, res) => {
  const task = await findTask(req);
  if (!validId(req.params.commentId)) throw httpError(400, "Invalid comment ID");
  const comment = task.comments.id(req.params.commentId);
  if (!comment) throw httpError(404, "Comment not found");
  const user = req.session.user;
  if (String(comment.author) !== user.id) throw httpError(403, "Only the author can edit this comment");
  if (typeof req.body.comment !== "string" || !req.body.comment.trim() || req.body.comment.length > 20000) throw httpError(400, "Enter a comment of up to 20000 characters");
  const before = comment.comment;
  comment.comment = req.body.comment.trim();
  comment.notificationsPending = true;
  task.history.push(history.event(user, "commented", [{ field: "comment", before, after: comment.comment }]));
  await task.save();
  await syncCommentNotifications(task, comment, user).catch(err => req.log?.error({ err }, "Mention notifications queued for retry"));
  await task.populate("employee", "name");
  res.json({ data: serialize(task) });
});
const downloadAttachment = handle(async (req, res) => {
  const task = await findTask(req);
  if (req.params.commentId && !validId(req.params.commentId) || !validId(req.params.attachmentId)) throw httpError(400, "Invalid attachment ID");
  const file = req.params.commentId ? task.comments.id(req.params.commentId)?.attachments.id(req.params.attachmentId) : task.attachments.id(req.params.attachmentId);
  if (!file?.storage_key || !file.storage_bucket) throw httpError(404, "Attachment not found");
  let object;
  try { object = await objectStorage.download(file); }
  catch (err) { throw httpError(err.name === "NoSuchKey" ? 404 : 502, "Unable to download attachment"); }
  res.set({ "Content-Type": "application/octet-stream", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store", "Content-Disposition": "attachment; filename*=UTF-8''" + encodeURIComponent(file.file_name).replace(/['()*]/g, char => "%" + char.charCodeAt(0).toString(16)) });
  res.on("close", () => object.Body.destroy());
  await pipeline(object.Body, res);
});
exports.downloadCommentAttachment = downloadAttachment;
exports.downloadTaskAttachment = downloadAttachment;
exports.listViews = handle(async (req, res) => {
  res.json({ data: await TaskView.find({ tenantId: req.session.user.tenantId, employee: req.session.user.id }) });
});
exports.createView = handle(async (req, res) => {
  const { name, priorities, statuses, labels, employees } = req.body;
  if (employees?.length) {
    if (!Array.isArray(employees) || employees.some(id => !validId(id))) throw httpError(400, "Invalid employees");
    const count = await Employee.countDocuments({ _id: { $in: employees }, tenantId: req.session.user.tenantId });
    if (count !== new Set(employees).size) throw httpError(400, "Employees must belong to your organization");
  }
  const view = await TaskView.create({ name, priorities, statuses, labels, employees, tenantId: req.session.user.tenantId, employee: req.session.user.id });
  res.status(201).json({ data: view });
});
exports.taskScope = taskScope;
exports.editableFields = editableFields;
exports.listTaskDepartments = handle(async (req, res) => {
  const departments = await departmentOptions(req.session.user.tenantId);
  // Authentication refreshes this department from the employee record on every request.
  const currentDepartment = departments.find(item => item.id === req.session.user.departmentId);
  res.json({ data: departments, defaultLabel: currentDepartment?.path || null });
});
