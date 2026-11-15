const { connectDB } = require("../DBConfig");
const Todo = require("../models/Todo");
const Comment = require("../models/Comment");
const TaskHistory = require("../models/TaskHistory");

async function migrate() {
  await connectDB();
  const cursor = Todo.collection.find({ $or: [{ comments: { $exists: true, $ne: [] } }, { history: { $exists: true, $ne: [] } }] });
  let tasks = 0;
  let comments = 0;
  let history = 0;
  for await (const task of cursor) {
    if (task.comments?.length && !(await Comment.exists({ tenantId: task.tenantId, taskId: task._id }))) {
      await Comment.insertMany(task.comments.map(comment => ({ ...comment, tenantId: task.tenantId, taskId: task._id })));
      comments += task.comments.length;
    }
    if (task.history?.length && !(await TaskHistory.exists({ tenantId: task.tenantId, taskId: task._id }))) {
      await TaskHistory.insertMany(task.history.map(event => ({ ...event, tenantId: task.tenantId, taskId: task._id })));
      history += task.history.length;
    }
    await Todo.collection.updateOne({ _id: task._id }, { $unset: { comments: "", history: "" } });
    tasks++;
  }
  console.log(`Migrated ${comments} comments and ${history} history events across ${tasks} tasks.`);
}

migrate().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => require("mongoose").disconnect());
