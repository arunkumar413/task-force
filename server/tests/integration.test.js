const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const { MongoMemoryServer } = require("mongodb-memory-server");
let mongo, app, admin, outsider, adminUser, outsiderUser;
const password = "test-password-123";
const outbox = [];
async function register(agent, slug) {
  const response = await agent.post("/api/register").send({
    organizationName: slug, username: slug, email: slug + "@example.com",
    password, confirmPassword: password, topLevelDepartmentName: "Leadership",
  }).expect(201);
  return response.body.data;
}
before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("task-force-tests");
  process.env.SESSION_SECRET = "integration-test-secret";
  process.env.LOG_LEVEL = "silent";
  process.env.NODE_ENV = "test";
  // Exercise invite/password flows without sending real messages.
  const mailer = require("../utils/mailer");
  mailer.sendMail = async message => { outbox.push(message); return { delivered: true }; };
  app = require("../index");
  await require("../DBConfig").connectDB();
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  admin = request.agent(app); outsider = request.agent(app);
  adminUser = await register(admin, "alpha");
  outsiderUser = await register(outsider, "beta");
}, { timeout: 180000 });
after(async () => {
  if (app) await app.locals.sessionStore.close();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test("registration creates department, organization, roles, and a password-free session", async () => {
  assert.ok(adminUser.departmentId);
  assert.equal(adminUser.fullAccess, true);
  assert.equal(adminUser.password, undefined);
  const me = await admin.get("/api/me").expect(200);
  assert.equal(me.body.data.id, adminUser.id);
  const profile = await admin.get("/api/profile").expect(200);
  assert.equal(profile.body.data.employee.organization.slug, "alpha");
  assert.equal(profile.body.data.sessions.length, 1);
  await admin.get("/api/hierarchy").expect(200);
  await admin.get("/api/resources").expect(200);
  await admin.get("/api/access").expect(200);
});

test("authentication rejects missing sessions, invalid credentials, and weak registration", async () => {
  await request(app).get("/api/tasks").expect(401);
  await request(app).post("/api/login").send({ email: "absent@example.com", password }).expect(401);
  await request(app).post("/api/register").send({ username: "bad", email: "bad@example.com", password: "x" }).expect(400);
});

test("tasks persist all supplied fields and protect tenant and author ownership", async () => {
  const created = await admin.post("/api/tasks").send({
    title: "Release", description: "**Ready**", priority: "Urgent", status: "Backlog",
    dueDate: "2026-12-01", labels: ["Backend"], tenantId: outsiderUser.tenantId,
    createdBy: outsiderUser.id, employee: adminUser.id, subtasks: [{ title: "Review", isDone: false }],
  }).expect(201);
  const task = created.body.data;
  assert.equal(task.tenantId, adminUser.tenantId);
  assert.equal(task.createdBy, adminUser.id);
  assert.equal(task.employee, adminUser.id);
  assert.equal(task.user, "alpha");
  assert.equal(task.subtasks.length, 1);
  await outsider.get("/api/tasks/" + task.id).expect(404);
  await outsider.patch("/api/tasks/" + task.id).send({ title: "Hijacked" }).expect(404);
  await outsider.delete("/api/tasks/" + task.id).expect(404);
  await admin.patch("/api/tasks/" + task.id).send({ employee: outsiderUser.id }).expect(400);
  const updated = await admin.patch("/api/tasks/" + task.id).send({
    status: "Cancelled", subtasks: [{ title: "Review", isDone: true }],
    attachments: [{ file_name: "Design", link: "https://example.com/design" }],
  }).expect(200);
  assert.equal(updated.body.data.status, "Cancelled");
  assert.equal(updated.body.data.employee, adminUser.id);
  assert.equal(updated.body.data.subtasks[0].isDone, true);
  const comment = await admin.post("/api/tasks/" + task.id + "/comments").send({ comment: "Ready to go" }).expect(201);
  assert.equal(comment.body.data.comments[0].author, adminUser.id);
  const list = await outsider.get("/api/tasks").expect(200);
  assert.equal(list.body.data.length, 0);
  await admin.delete("/api/tasks/" + task.id).expect(204);
  await admin.get("/api/tasks/" + task.id).expect(404);
});

test("task validation rejects invalid IDs, statuses, dates, empty titles, and unsafe attachment URLs", async () => {
  await admin.get("/api/tasks/not-an-id").expect(400);
  await admin.post("/api/tasks").send({ title: "" }).expect(400);
  await admin.post("/api/tasks").send({ title: "Bad", status: "Invalid" }).expect(400);
  await admin.post("/api/tasks").send({ title: "Bad", dueDate: "not-a-date" }).expect(400);
  await admin.post("/api/tasks").send({ title: "Bad", attachments: [{ file_name: "Bad", link: "javascript:alert(1)" }] }).expect(400);
});

test("saved views belong to their creator and tenant", async () => {
  const response = await admin.post("/api/views").send({ name: "Urgent", priorities: ["Urgent"], statuses: ["Backlog"], labels: ["Backend"] }).expect(201);
  assert.ok(response.body.data.id);
  const own = await admin.get("/api/views").expect(200);
  assert.equal(own.body.data.length, 1);
  const other = await outsider.get("/api/views").expect(200);
  assert.equal(other.body.data.length, 0);
  await admin.post("/api/views").send({ name: "Cross tenant", employees: [outsiderUser.id] }).expect(400);
});

test("invitation, acceptance, department assignment, and live permission revocation work", async () => {
  const invited = await admin.post("/api/employees/invite").send({
    rows: [{ name: "Teammate", email: "teammate@example.com" }],
    departmentId: adminUser.departmentId, roleName: "Employee",
  }).expect(201);
  const invitedId = invited.body.data.created[0].id;
  const code = outbox.at(-1).text.match(/\b\d{6}\b/)[0];
  const member = request.agent(app);
  await member.post("/api/invite/accept").send({ email: "teammate@example.com", otp: code, password, confirmPassword: password, organizationSlug: "alpha" }).expect(200);
  await member.post("/api/login").send({ email: "teammate@example.com", password }).expect(200);
  await member.get("/api/access").expect(403);
  const task = await member.post("/api/tasks").send({ title: "Member task" }).expect(201);
  await outsider.get("/api/tasks/" + task.body.data.id).expect(404);
  // Managers see their reports; the invited employee cannot see unrelated employees' tasks.
  const privateTask = await admin.post("/api/tasks").send({ title: "Admin task" }).expect(201);
  await member.get("/api/tasks/" + privateTask.body.data.id).expect(404);
  await member.post("/api/tasks").send({ title: "Organization assignment", employee: adminUser.id }).expect(201);
  const roles = await admin.get("/api/access").expect(200);
  const employeeRole = roles.body.data.roles.find(role => role.name === "Employee");
  await admin.patch("/api/access/roles/" + employeeRole.id).send({ resourceKey: "task", actions: ["read"] }).expect(200);
  await member.post("/api/tasks").send({ title: "Denied" }).expect(403);
  await member.get("/api/tasks").expect(200);
  // Role changes also take effect on an existing session.
  await admin.put("/api/access/members/" + invitedId + "/role").send({ roleId: roles.body.data.roles.find(role => role.name === "Manager").id }).expect(200);
  const refreshed = await member.get("/api/me").expect(200);
  assert.deepEqual(refreshed.body.data.roles, ["Manager"]);
});

test("password changes revoke other devices while preserving the requesting session", async () => {
  const second = request.agent(app);
  await second.post("/api/login").send({ email: "alpha@example.com", password }).expect(200);
  const profile = await admin.get("/api/profile").expect(200);
  assert.equal(profile.body.data.sessions.length, 2);
  await admin.post("/api/profile/password/otp").send({}).expect(200);
  await admin.post("/api/profile/password/otp").send({}).expect(429);
  const code = outbox.at(-1).text.match(/\b\d{6}\b/)[0];
  await admin.post("/api/profile/password").send({ otp: code, password: "new-password-456", confirmPassword: "new-password-456" }).expect(200);
  await second.get("/api/me").expect(401);
  await admin.get("/api/me").expect(200);
  await admin.post("/api/profile/password").send({ otp: code, password, confirmPassword: password }).expect(400);
});

test("supplied task data maps into the extended MongoDB model without losing fields", async () => {
  const { fakeTaskData } = require("../dummyData/fakeTaskDataInsertIntoDB");
  const Todo = require("../models/Todo");
  assert.equal(fakeTaskData.length, 22);
  for (const source of fakeTaskData) {
    const task = new Todo({ ...source, dueDate: source.due_date, tenantId: adminUser.tenantId, employee: adminUser.id, createdBy: adminUser.id });
    await task.validate();
    assert.equal(task.description, source.description);
    assert.equal(task.dueDate.toISOString(), source.due_date);
    assert.equal(task.priority, source.priority);
    assert.equal(task.status, source.status);
  }
});

test("unknown API routes return JSON and sign-out destroys the session", async () => {
  const unknown = await admin.get("/api/unknown").expect(404);
  assert.equal(unknown.headers["content-type"].includes("application/json"), true);
  await outsider.post("/api/logout").expect(200);
  await outsider.get("/api/me").expect(401);
});

test("MongoDB demo seeder imports the supplied tasks and can be rerun without duplicates", async () => {
  const { execFileSync } = require("node:child_process");
  const path = require("node:path");
  const runSeed = () => execFileSync(process.execPath, [path.join(__dirname, "../scripts/seedDemo.js")], { env: process.env });
  runSeed();
  const Todo = require("../models/Todo");
  const Organization = require("../models/Organization");
  const acme = await Organization.findOne({ slug: "acme" });
  assert.equal(await Todo.countDocuments({ tenantId: acme._id }), 22);
  const totalBeforeReseed = await Todo.countDocuments();
  runSeed();
  assert.equal(await Todo.countDocuments(), totalBeforeReseed);
  const demo = request.agent(app);
  await demo.post("/api/login").send({ email: "ava.chen@acme.example", password: "demo123" }).expect(200);
  const tasks = await demo.get("/api/tasks").expect(200);
  assert.equal(tasks.body.data.length, 22);
});

test("demo employees can add task links, and the old permission grant can be repaired without reseeding", async () => {
  const employee = request.agent(app);
  const login = await employee.post("/api/login").send({ email: "liam.ortiz@acme.example", password: "demo123" }).expect(200);
  const list = await employee.get("/api/mytasks").expect(200);
  assert.ok(list.body.data.length > 0);
  assert.ok(list.body.data.every(task => task.employee === login.body.data.id));
  const accessible = await employee.get("/api/tasks").expect(200);
  assert.ok(accessible.body.data.every(task => task.employee === login.body.data.id));
  const task = list.body.data[0];
  const attachments = [{ file_name: "Requirements", link: "https://example.com/requirements" }];
  await employee.patch("/api/tasks/" + task.id).send({ attachments }).expect(200);
  const stored = await employee.get("/api/tasks/" + task.id).expect(200);
  assert.equal(stored.body.data.attachments[0].link, attachments[0].link);

  const Permission = require("../models/Permission");
  const Resource = require("../models/Resource");
  const resource = await Resource.findOne({ key: "task" });
  const grantFilter = { tenantId: login.body.data.tenantId, role: login.body.data.roleIds[0], resource: resource._id };
  await Permission.updateOne(grantFilter, { $set: { update: false } });
  await employee.patch("/api/tasks/" + task.id).send({ attachments }).expect(403);
  const { repairDemoTaskPermissions } = require("../scripts/repairDemoTaskPermissions");
  assert.equal((await repairDemoTaskPermissions()).modifiedCount, 1);
  assert.equal((await repairDemoTaskPermissions()).modifiedCount, 0);
  // Existing sessions pick up the repaired grant without another sign-in.
  await employee.patch("/api/tasks/" + task.id).send({ attachments }).expect(200);
  const repaired = await Permission.findOne(grantFilter);
  assert.equal(repaired.delete, false);
  const reloaded = await employee.get("/api/tasks/" + task.id).expect(200);
  assert.equal(reloaded.body.data.attachments.length, 1);
  assert.equal(reloaded.body.data.title, task.title);

  const hr = request.agent(app);
  await hr.post("/api/login").send({ email: "sam.okonkwo@acme.example", password: "demo123" }).expect(200);
  await hr.patch("/api/tasks/" + task.id).send({ attachments }).expect(403);
});

test("assignee search and assignment stay within the active organization directory", async () => {
  await request(app).get("/api/tasks/assignees").expect(401);
  const member = request.agent(app);
  await member.post("/api/login").send({ email: "liam.ortiz@acme.example", password: "demo123" }).expect(200);
  const result = await member.get("/api/tasks/assignees?q=noah").expect(200);
  assert.equal(result.body.data.length, 1);
  const noah = result.body.data[0];
  assert.equal(noah.email, "noah.kim@acme.example");
  assert.equal(noah.password, undefined);
  assert.equal(noah.roleIds, undefined);
  for (const query of ["NOAH", noah.email, noah.username]) {
    const found = await member.get("/api/tasks/assignees").query({ q: query }).expect(200);
    assert.ok(found.body.data.some(employee => employee.id === noah.id));
  }
  for (const query of [".*", "teammate@example.com"]) {
    const found = await member.get("/api/tasks/assignees").query({ q: query }).expect(200);
    assert.equal(found.body.data.length, 0);
  }
  const created = await member.post("/api/tasks").send({ title: "Directory assignment", employee: noah.id }).expect(201);
  const sofia = (await member.get("/api/tasks/assignees?q=sofia").expect(200)).body.data[0];
  await member.patch("/api/tasks/" + created.body.data.id).send({ employee: sofia.id }).expect(200);
  const Employee = require("../models/Employee");
  await Employee.updateOne({ _id: noah.id }, { isActive: false });
  const inactive = await member.get("/api/tasks/assignees?q=noah").expect(200);
  assert.equal(inactive.body.data.length, 0);
  await member.patch("/api/tasks/" + created.body.data.id).send({ employee: noah.id }).expect(400);
  await Employee.updateOne({ _id: noah.id }, { isActive: true });
});
