const express = require("express");
const { checkAuthentication } = require("../middlewares/checkAuthentication");
const { checkAuthorization } = require("../middlewares/checkAuthroization");
const {
  loginController,
  logoutController,
  registerController,
} = require("../controllers/loginController");
const { getMyTasks } = require("../controllers/tasksController");
const { getTaskData } = require("../controllers/getTaskData");

const router = express.Router();

router.get(
  "/mytasks",
  checkAuthentication,
  checkAuthorization({ resource: "/pets", rolesWithAccess: ["VP", "QA"] }),
  getMyTasks
);

router.get("/task-data/:taskId", checkAuthentication, getTaskData);

router.post("/login", loginController);
router.post("/logout", logoutController);
router.post("/register", registerController);

module.exports = router;
