const express = require("express");
const { checkAuthentication } = require("../middlewares/checkAuthentication");
const { checkAuthorization } = require("../middlewares/checkAuthroization");
const tasks = require("../controllers/tasksController");
const router = express.Router();
router.use(checkAuthentication);
const allow = action => checkAuthorization({ resource: "task", action });
router.get("/tasks/departments", checkAuthorization({ permissions: ["task.write", "task.update"] }), tasks.listTaskDepartments);
router.get("/tasks/assignees",
  checkAuthorization({ permissions: ["task.write", "task.update"] }),
  require("../controllers/userController").getTaskAssignees);
router.get("/tasks", allow("read"), tasks.listTasks);
router.post("/tasks", allow("write"), tasks.createTask);
router.get("/tasks/:taskId", allow("read"), tasks.getTask);
router.patch("/tasks/:taskId", allow("update"), tasks.updateTask);
router.delete("/tasks/:taskId", allow("delete"), tasks.deleteTask);
router.post("/tasks/:taskId/comments", allow("update"), tasks.addComment);
router.get("/tasks/:taskId/comments/:commentId/attachments/:attachmentId", allow("read"), tasks.downloadCommentAttachment);
router.get("/task-data/:taskId", allow("read"), tasks.getTask);
router.get("/views", allow("read"), tasks.listViews);
router.post("/views", allow("read"), tasks.createView);
module.exports = router;
