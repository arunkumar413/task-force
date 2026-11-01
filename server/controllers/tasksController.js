const mongoose = require("mongoose");
const Todo = require("../models/Todo");
const Employee = require("../models/Employee");
const TaskView = require("../models/TaskView");

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
  const user = req.session.user;
  const fields = await editableFields(req.body, user);
  const task = await Todo.create({ ...fields, employee: fields.employee || user.id, tenantId: user.tenantId, createdBy: user.id });
  await task.populate("employee", "name");
  res.status(201).json({ data: serialize(task) });
});
exports.updateTask = handle(async (req, res) => {
  const task = await findTask(req);
  task.set(await editableFields(req.body, req.session.user));
  await task.save();
  await task.populate("employee", "name");
  res.json({ data: serialize(task) });
});
exports.deleteTask = handle(async (req, res) => {
  const task = await findTask(req);
  await task.deleteOne();
  res.status(204).end();
});
exports.addComment = handle(async (req, res) => {
  const task = await findTask(req);
  const user = req.session.user;
  task.comments.push({ comment: req.body.comment, author: user.id, username: user.username, email: user.email, attachments: req.body.attachments || [] });
  await task.save();
  await task.populate("employee", "name");
  res.status(201).json({ data: serialize(task) });
});
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
