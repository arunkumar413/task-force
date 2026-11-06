const Employee = require("../models/Employee");
const Notification = require("../models/Notification");

// Accept plain emails and @email mentions, including Markdown links. Match whole
// addresses so a suffix of another address cannot notify the wrong employee.
function mentionedEmails(text) {
  return [...new Set((text.match(/(?<![a-z0-9.!#$%&'*+/=?^_`{|}~@-])@?[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+/gi) || [])
    .map(email => email.replace(/^@/, "").toLowerCase()))];
}
async function syncCommentNotifications(task, comment, actor) {
  const recipients = await Employee.find({ tenantId: task.tenantId, isActive: true,
    email: { $in: mentionedEmails(comment.comment) } }).select("_id");
  // An edit removes obsolete mentions; unchanged mentions retain their read state.
  const scope = { tenantId: task.tenantId, taskId: task._id, commentId: comment._id };
  await Notification.deleteMany({ ...scope, employeeId: { $nin: recipients.map(item => item._id) } });
  for (const recipient of recipients) {
    const key = { ...scope, employeeId: recipient._id };
    try {
      await Notification.updateOne(key, { $setOnInsert: { ...key, actorId: actor.id,
        actorName: actor.name || actor.username, type: "comment_mention", readAt: null } }, { upsert: true });
    } catch (err) { if (err.code !== 11000) throw err; }
  }
  const Todo = require("../models/Todo");
  const result = await Todo.updateOne({ _id: task._id, tenantId: task.tenantId,
    comments: { $elemMatch: { _id: comment._id, comment: comment.comment } } },
    { $set: { "comments.$.notificationsPending": false } });
  if (!result.matchedCount) {
    // An edit or deletion raced this delivery. Reconcile the current text on
    // the next pass rather than leaving recipients from the stale version.
    const current = await Todo.updateOne({ _id: task._id, tenantId: task.tenantId, "comments._id": comment._id },
      { $set: { "comments.$.notificationsPending": true } });
    if (!current.matchedCount) await Notification.deleteMany(scope);
  }
}
// A durable flag on the comment survives process restarts and transient failures.
function startNotificationRetries(logger) {
  let running = false;
  const retry = async () => {
    if (running) return;
    running = true;
    try {
      const tasks = await require("../models/Todo").find({ "comments.notificationsPending": true }).select("+comments.notificationsPending").limit(100);
      for (const task of tasks) for (const comment of task.comments) {
        if (!comment.notificationsPending) continue;
        const actor = await Employee.findOne({ _id: comment.author, tenantId: task.tenantId });
        if (actor) await syncCommentNotifications(task, comment, { id: actor.id, name: actor.name, username: actor.username });
      }
    } catch (err) { logger.error({ err }, "Mention notification retry failed"); }
    finally { running = false; }
  };
  const timer = setInterval(retry, 30000);
  timer.unref();
  retry();
  return timer;
}
module.exports = { mentionedEmails, syncCommentNotifications, startNotificationRetries };
