const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { connectDB, MONGODB_URI } = require("./DBConfig");
const { SERVER_PORT, SESSION_MAX_AGE_MS } = require("./constants");
const { checkAuthentication: authenticate } = require("./middlewares/checkAuthentication");
const { checkAuthorization } = require("./middlewares/checkAuthroization");
const auth = require("./controllers/loginController");
const profile = require("./controllers/profileController");
const password = require("./controllers/passwordController");
const employees = require("./controllers/userController");
const invite = require("./controllers/inviteController");
const access = require("./controllers/accessController");
const { getHierarchy } = require("./controllers/hierarchyController");
const { listResources } = require("./controllers/resourceController");
const { dynamicQueryParams } = require("./controllers/dynamicQueryParams");
const { getMyTasks } = require("./controllers/tasksController");
const logger = require("./logger");
const app = express();
const { loginLimits, registrationLimit, emailChangeLimit } = require("./middlewares/authRateLimit");
const isProduction = process.env.NODE_ENV === "production";
const clientDist = path.join(__dirname, "../client/dist");
const authorize = (resource, action) => checkAuthorization({ resource, action });
if (isProduction && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "keyboard cat")) {
  throw new Error("Set SESSION_SECRET before starting in production");
}
if (isProduction) app.set("trust proxy", 1);
app.use(require("pino-http")({ logger, genReqId: () => require("node:crypto").randomUUID() }));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    const allowed = String(process.env.APP_ORIGIN || "").split(",").map(value => value.trim());
    const local = !isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
    callback(!origin || local || allowed.includes(origin) ? null : Object.assign(new Error("Origin not allowed"), { status: 403 }), true);
  },
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
const sessionStore = MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: "sessions" });
app.locals.sessionStore = sessionStore;
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "task-force-local-development",
  resave: false, saveUninitialized: false,
  cookie: { secure: isProduction, httpOnly: true, sameSite: "lax", maxAge: SESSION_MAX_AGE_MS, path: "/" },
}));
app.get("/api", (req,res) => res.json({ data: "Task Force API" }));
app.post("/api/register", registrationLimit, auth.registerController);
app.post("/api/login", loginLimits, auth.loginController);
app.post("/api/logout", auth.logoutController);
app.post("/api/invite/accept", invite.acceptInvite);
app.get("/api/me", authenticate, auth.getSessionController);
app.get("/api/profile", authenticate, profile.getProfile);
app.patch("/api/profile", authenticate, emailChangeLimit, profile.updateProfile);
app.post("/api/profile/password/otp", authenticate, password.requestPasswordOtp);
app.post("/api/profile/password", authenticate, password.changePassword);
app.get("/api/resources", authenticate, authorize("resource", "read"), listResources);
app.get("/api/access", authenticate, authorize("role", "read"), access.getAccessCatalog);
app.get("/api/access/members", authenticate, authorize("role", "read"), access.getAccessMembers);
app.get("/api/access/resources", authenticate, authorize("role", "read"), access.getAccessResources);
app.patch("/api/access/roles/:roleId", authenticate, authorize("role", "update"), access.updateRoleResource);
app.put("/api/access/members/:employeeId/role", authenticate, authorize("employee", "update"), authorize("role", "update"), access.setMemberRole);
app.get("/api/hierarchy", authenticate, authorize("employee", "read"), getHierarchy);
app.get("/api/mytasks", authenticate, authorize("task", "read"), getMyTasks);
app.get("/api/employees", authenticate, authorize("employee", "read"), employees.getEmployees);
app.get("/api/employees/search", authenticate, authorize("employee", "read"), dynamicQueryParams);
app.post("/api/employees/invite", authenticate, authorize("employee", "write"), invite.bulkInviteEmployees);
app.patch("/api/employees/:id/department", authenticate, employees.updateEmployeeDepartment);
app.use("/api", require("./routes/router"));
app.use("/api", (req, res) => res.status(404).json({ statusMessage: "API route not found" }));
app.use(express.static(clientDist));
app.get("*", (req, res) => res.sendFile(path.join(clientDist, "index.html")));
app.use(require("./middlewares/errorHandlerMiddleware"));
if (require.main === module) {
  connectDB().then(() => app.listen(SERVER_PORT, "0.0.0.0", () => logger.info({ port: SERVER_PORT }, "Task Force listening")))
    .catch(err => { logger.error({ err }, "MongoDB startup failed"); process.exit(1); });
}
module.exports = app;
