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

test("email changes require the current password, rotate sessions, and invalidate old OTPs", async () => {
  const owner = request.agent(app);
  const identity = await register(owner, "email-security");
  const payload = { name: identity.name, username: identity.username, email: "replacement@example.com" };
  await owner.post("/api/profile/password/otp").send({}).expect(200);
  const previousCode = outbox.at(-1).text.match(/\b\d{6}\b/)[0];
  const missing = await owner.patch("/api/profile").send(payload).expect(403);
  const wrong = await owner.patch("/api/profile").send({ ...payload, currentPassword: "wrong-password" }).expect(403);
  assert.equal(missing.body.statusMessage, wrong.body.statusMessage);
  const unchanged = await owner.get("/api/me").expect(200);
  assert.equal(unchanged.body.data.email, identity.email);
  await owner.patch("/api/profile").send({ ...payload, email: identity.email, name: "Updated name" }).expect(200);
  const updated = await owner.patch("/api/profile").send({ ...payload, currentPassword: password }).expect(200);
  assert.ok(updated.headers["set-cookie"]);
  assert.equal(updated.body.data.employee.email, payload.email);
  await owner.post("/api/profile/password").send({ otp: previousCode, password: "replacement-password", confirmPassword: "replacement-password" }).expect(400);
  const me = await owner.get("/api/me").expect(200);
  assert.equal(me.body.data.email, payload.email);
  await request(app).post("/api/login").send({ email: payload.email, password }).expect(200);
});

test("login failures are generic and account limits cannot be bypassed by new sessions or forwarded headers", async () => {
  const { AuthRateLimit } = require("../middlewares/authRateLimit");
  await AuthRateLimit.deleteMany({});
  const validEmail = "replacement@example.com";
  const wrong = await request(app).post("/api/login").send({ email: validEmail, password: "incorrect" }).expect(401);
  const unknown = await request(app).post("/api/login").send({ email: "unknown-security@example.com", password: "incorrect" }).expect(401);
  const badOrg = await request(app).post("/api/login").send({ email: validEmail, password, organizationSlug: "missing-organization" }).expect(401);
  assert.deepEqual(wrong.body, unknown.body);
  assert.deepEqual(wrong.body, badOrg.body);
  await request(app).post("/api/login").send({ email: { $ne: null }, password }).expect(400);
  await AuthRateLimit.deleteMany({});
  const attempts = await Promise.all(Array.from({ length: 12 }, (_, i) => request(app).post("/api/login")
    .set("X-Forwarded-For", "198.51.100." + i)
    .send({ email: i % 2 ? " REPLACEMENT@EXAMPLE.COM " : validEmail, password: "incorrect", organizationSlug: i % 2 ? "missing-organization" : undefined })));
  assert.equal(attempts.filter(response => response.status === 401).length, 10);
  assert.equal(attempts.filter(response => response.status === 429).length, 2);
  const blocked = await request(app).post("/api/login").send({ email: validEmail, password }).expect(429);
  assert.ok(Number(blocked.headers["retry-after"]) > 0);
  await AuthRateLimit.deleteMany({});
  await request(app).post("/api/login").send({ email: validEmail, password }).expect(200);
});

test("IP login and registration budgets are independent shared counters", async () => {
  const { AuthRateLimit } = require("../middlewares/authRateLimit");
  await AuthRateLimit.deleteMany({});
  for (let i = 0; i < 100; i++) await request(app).post("/api/login").send({ email: "invalid-" + i }).expect(400);
  await request(app).post("/api/login").set("X-Forwarded-For", "203.0.113.1").send({ email: "different@example.com", password }).expect(429);
  await AuthRateLimit.deleteMany({});
  for (let i = 0; i < 20; i++) await request(app).post("/api/register").send({}).expect(400);
  await request(app).post("/api/register").send({}).expect(429);
  await AuthRateLimit.deleteMany({});
});

test("current-password guesses on email changes are limited per employee", async () => {
  const { AuthRateLimit } = require("../middlewares/authRateLimit");
  await AuthRateLimit.deleteMany({});
  const owner = request.agent(app);
  await owner.post("/api/login").send({ email: "replacement@example.com", password }).expect(200);
  const payload = { name: "Owner", username: "email-security", email: "takeover@example.com", currentPassword: "incorrect" };
  for (let i = 0; i < 10; i++) await owner.patch("/api/profile").send(payload).expect(403);
  await owner.patch("/api/profile").send(payload).expect(429);
  const me = await owner.get("/api/me").expect(200);
  assert.equal(me.body.data.email, "replacement@example.com");
  await AuthRateLimit.deleteMany({});
});

test("tasks default to the creator department hierarchy and validate selected organization departments", async () => {
  await outsider.post("/api/login").send({ email: "beta@example.com", password }).expect(200);
  const Department = require("../models/Department");
  const child = await Department.create({ tenantId: outsiderUser.tenantId, name: "Analytics", parentId: outsiderUser.departmentId });
  const directory = await outsider.get("/api/tasks/departments").expect(200);
  assert.equal(directory.body.data.find(item => item.id === String(child._id)).path, "/leadership/analytics");
  assert.ok(!directory.body.data.some(item => item.id === adminUser.departmentId));
  const created = await outsider.post("/api/tasks").send({ title: "Department default" }).expect(201);
  assert.equal(created.body.data.departmentId, outsiderUser.departmentId);
  assert.deepEqual(created.body.data.labels, ["/leadership"]);
  const updated = await outsider.patch("/api/tasks/" + created.body.data.id).send({ labels: ["Customer, Reporting", "/leadership/analytics", "Customer, Reporting"] }).expect(200);
  assert.deepEqual(updated.body.data.labels, ["Customer, Reporting", "/leadership/analytics", "/leadership"]);
  assert.equal(updated.body.data.departmentId, outsiderUser.departmentId);
  const preserved = await outsider.patch("/api/tasks/" + created.body.data.id).send({ title: "Preserve labels" }).expect(200);
  assert.deepEqual(preserved.body.data.labels, updated.body.data.labels);
  const cleared = await outsider.patch("/api/tasks/" + created.body.data.id).send({ labels: [], departmentId: null, departmentLabel: "" }).expect(200);
  assert.deepEqual(cleared.body.data.labels, ["/leadership"]);
  assert.equal(cleared.body.data.departmentId, outsiderUser.departmentId);
  assert.equal(cleared.body.data.departmentLabel, "/leadership");
  const explicitEmpty = await outsider.post("/api/tasks").send({ title: "Cannot omit default", labels: [] }).expect(201);
  assert.deepEqual(explicitEmpty.body.data.labels, ["/leadership"]);
});

test("default label follows the logged-in employee's current database department", async () => {
  const member = request.agent(app);
  await member.post("/api/login").send({ email: "beta@example.com", password }).expect(200);
  const Employee = require("../models/Employee");
  const Department = require("../models/Department");
  const current = await Department.findOne({ tenantId: outsiderUser.tenantId, name: "Analytics" });
  await Employee.updateOne({ _id: outsiderUser.id }, { departmentId: current._id });
  try {
    const options = await member.get("/api/tasks/departments").expect(200);
    assert.equal(options.body.defaultLabel, "/leadership/analytics");
    const created = await member.post("/api/tasks").send({ title: "Current department default" }).expect(201);
    assert.deepEqual(created.body.data.labels, ["/leadership/analytics"]);
    await Employee.updateOne({ _id: outsiderUser.id }, { departmentId: null });
    const unassigned = await member.get("/api/tasks/departments").expect(200);
    assert.equal(unassigned.body.defaultLabel, null);
  } finally {
    await Employee.updateOne({ _id: outsiderUser.id }, { departmentId: outsiderUser.departmentId });
  }
});

test("comment uploads persist multiple files, enforce access and limits, and clean up failed uploads", async () => {
  const storage = require("../utils/objectStorage");
  const { Readable } = require("node:stream");
  const original = { upload: storage.upload, remove: storage.remove, download: storage.download };
  const objects = new Map();
  let failOn = "";
  storage.upload = async (key, file) => {
    if (file.originalname === failOn) throw new Error("Simulated object storage failure");
    objects.set(key, Buffer.from(file.buffer));
    return { storage_key: key, storage_bucket: "isolated-test-bucket" };
  };
  storage.remove = async file => { objects.delete(file.storage_key); };
  storage.download = async file => ({ Body: Readable.from(objects.get(file.storage_key)) });
  try {
    const owner = request.agent(app);
    await register(owner, "upload-security");
    const created = await owner.post("/api/tasks").send({ title: "Comment file uploads" }).expect(201);
    const url = "/api/tasks/" + created.body.data.id + "/comments";
    await request(app).post(url).field("comment", "Unauthenticated").attach("files", Buffer.from("no"), "denied.txt").expect(401);
    await outsider.post(url).field("comment", "Other organization").attach("files", Buffer.from("no"), "denied.txt").expect(404);
    assert.equal(objects.size, 0);
    await owner.post(url).field("comment", " ").attach("files", Buffer.from("no"), "invalid.txt").expect(400);
    assert.equal(objects.size, 0);
    const posted = await owner.post(url).field("comment", "**Attached files**")
      .attach("files", Buffer.from("first content"), "one.txt")
      .attach("files", Buffer.from("second content"), "two.txt").expect(201);
    const comment = posted.body.data.comments[0];
    assert.equal(comment.attachments.length, 2);
    assert.equal(objects.size, 2);
    assert.equal(comment.attachments[0].file_name, "one.txt");
    const download = new URL(comment.attachments[0].link).pathname;
    await request(app).get(download).expect(401);
    await outsider.get(download).expect(404);
    const downloaded = await owner.get(download).expect(200);
    assert.equal(downloaded.body.toString(), "first content");
    assert.match(downloaded.headers["content-disposition"], /^attachment;/);
    assert.equal(downloaded.headers["x-content-type-options"], "nosniff");
    const persisted = await owner.get("/api/tasks/" + created.body.data.id).expect(200);
    assert.equal(persisted.body.data.comments[0].attachments[1].file_name, "two.txt");
    failOn = "fail.txt";
    await owner.post(url).field("comment", "Upload failure")
      .attach("files", Buffer.from("cleanup"), "cleanup.txt")
      .attach("files", Buffer.from("fail"), "fail.txt").expect(502);
    assert.equal(objects.size, 2);
    assert.equal((await owner.get("/api/tasks/" + created.body.data.id)).body.data.comments.length, 1);
    failOn = "";
    const Todo = require("../models/Todo");
    const originalWrite = Todo.updateOne;
    try {
      Todo.updateOne = async () => { throw new Error("Simulated database write failure"); };
      await owner.post(url).field("comment", "Database failure").attach("files", Buffer.from("cleanup"), "rollback.txt").expect(500);
    } finally { Todo.updateOne = originalWrite; }
    assert.equal(objects.size, 2);
    assert.equal((await owner.get("/api/tasks/" + created.body.data.id)).body.data.comments.length, 1);
    await owner.post(url).field("comment", "Oversized")
      .attach("files", Buffer.alloc(10 * 1024 * 1024 + 1), "large.bin").expect(413);
    let tooMany = owner.post(url).field("comment", "Too many files");
    for (let index = 0; index < 6; index++) tooMany = tooMany.attach("files", Buffer.from("x"), index + ".txt");
    await tooMany.expect(413);
    const forged = await owner.post(url).send({ comment: "External link", attachments: [{ file_name: "External", link: "https://example.com/file", storage_key: "forged", storage_bucket: "other" }] }).expect(201);
    assert.equal(forged.body.data.comments[1].attachments[0].storage_key, undefined);
  } finally { Object.assign(storage, original); }
});

test("new tasks upload multiple attachments, protect downloads, and clean up failed creation", async () => {
  const storage = require("../utils/objectStorage");
  const { Readable } = require("node:stream");
  const original = { upload: storage.upload, remove: storage.remove, download: storage.download };
  const objects = new Map();
  storage.upload = async (key, file) => {
    if (file.originalname === "fail.txt") throw new Error("Simulated storage failure");
    objects.set(key, Buffer.from(file.buffer));
    return { storage_key: key, storage_bucket: "test-task-files" };
  };
  storage.remove = async file => { objects.delete(file.storage_key); };
  storage.download = async file => ({ Body: Readable.from(objects.get(file.storage_key)) });
  try {
    const owner = request.agent(app);
    const identity = await register(owner, "task-upload");
    await request(app).post("/api/tasks").field("task", JSON.stringify({ title: "Denied" })).attach("files", Buffer.from("x"), "denied.txt").expect(401);
    await owner.post("/api/tasks").field("task", "invalid json").attach("files", Buffer.from("x"), "invalid.txt").expect(400);
    await owner.post("/api/tasks").field("task", JSON.stringify({ title: "" })).attach("files", Buffer.from("x"), "invalid.txt").expect(400);
    assert.equal(objects.size, 0);
    const created = await owner.post("/api/tasks").field("task", JSON.stringify({ title: "Uploaded task", tenantId: outsiderUser.tenantId, labels: ["Release"] }))
      .attach("files", Buffer.from("one"), "one.png").attach("files", Buffer.from("two"), "two.txt").expect(201);
    const task = created.body.data;
    assert.equal(task.tenantId, identity.tenantId);
    assert.equal(task.attachments.length, 2);
    assert.ok(task.labels.includes("/leadership"));
    const path = new URL(task.attachments[0].link).pathname;
    await request(app).get(path).expect(401);
    await outsider.get(path).expect(404);
    const download = await owner.get(path).expect(200);
    assert.equal(download.body.toString(), "one");
    const preserved = await owner.patch("/api/tasks/" + task.id).send({ attachments: task.attachments.map(file => ({ ...file, storage_key: "forged" })) }).expect(200);
    assert.equal(preserved.body.data.attachments[0].storage_key, task.attachments[0].storage_key);
    const forged = await owner.patch("/api/tasks/" + task.id).send({ attachments: [...task.attachments, { file_name: "fake.txt", link: "https://example.com/fake", storage_key: "fake", storage_bucket: "test-task-files" }] }).expect(200);
    assert.equal(forged.body.data.attachments[2].storage_key, undefined);
    await owner.post("/api/tasks").field("task", JSON.stringify({ title: "Failed upload" }))
      .attach("files", Buffer.from("cleanup"), "cleanup.txt").attach("files", Buffer.from("fail"), "fail.txt").expect(502);
    assert.equal(objects.size, 2);
    const Todo = require("../models/Todo");
    assert.equal(await Todo.countDocuments({ tenantId: identity.tenantId }), 1);
    const originalSave = Todo.prototype.save;
    try {
      Todo.prototype.save = async () => { throw new Error("Simulated database failure"); };
      await owner.post("/api/tasks").field("task", JSON.stringify({ title: "Failed database" })).attach("files", Buffer.from("cleanup"), "cleanup.txt").expect(500);
    } finally { Todo.prototype.save = originalSave; }
    assert.equal(objects.size, 2);
  } finally { Object.assign(storage, original); }
});

test("task history records actor and field diffs, preserves comments atomically, and rejects forged records", async () => {
  const owner = request.agent(app);
  const identity = await register(owner, "history-owner");
  const created = await owner.post("/api/tasks").send({ title: "History original", priority: "Low", history: [{ actorName: "Forged" }] }).expect(201);
  const id = created.body.data.id;
  assert.equal(created.body.data.history.length, 1);
  assert.equal(created.body.data.history[0].action, "created");
  assert.equal(created.body.data.history[0].actor, identity.id);
  const updated = await owner.patch("/api/tasks/" + id).send({ title: "History updated", priority: "High", subtasks: [{ title: "Review", isDone: false }], attachments: [{ file_name: "Spec", link: "https://example.com/spec" }], history: [] }).expect(200);
  const event = updated.body.data.history[1];
  assert.equal(event.actorName, "history-owner");
  assert.equal(event.actor, identity.id);
  assert.ok(event.occurredAt);
  assert.deepEqual(event.changes.find(item => item.field === "title"), { field: "title", before: "History original", after: "History updated" });
  assert.equal(event.changes.find(item => item.field === "priority").before, "Low");
  assert.equal(event.changes.find(item => item.field === "priority").after, "High");
  assert.deepEqual(event.changes.find(item => item.field === "subtasks").after, [{ title: "Review", isDone: false }]);
  await owner.patch("/api/tasks/" + id).send({ title: "History updated", priority: "High", history: [{ actorName: "Forged" }] }).expect(200);
  await owner.patch("/api/tasks/" + id).send({ status: "invalid" }).expect(400);
  const unchanged = await owner.get("/api/tasks/" + id).expect(200);
  assert.equal(unchanged.body.data.history.length, 2);
  const comments = await Promise.all(["First", "Second"].map(comment => owner.post("/api/tasks/" + id + "/comments").send({ comment }).expect(201)));
  const persisted = await owner.get("/api/tasks/" + id).expect(200);
  assert.equal(persisted.body.data.comments.length, 2);
  assert.equal(persisted.body.data.history.length, 4);
  assert.equal(persisted.body.data.history.filter(item => item.action === "commented").length, 2);
  assert.ok(persisted.body.data.history.some(item => item.changes.some(change => change.field === "comment" && change.after === "Second")));
  await outsider.get("/api/tasks/" + id).expect(404);
  const Todo = require("../models/Todo");
  const stale = await Todo.findById(id);
  await owner.patch("/api/tasks/" + id).send({ status: "Done" }).expect(200);
  stale.title = "Stale update";
  await assert.rejects(() => stale.save(), error => error.name === "VersionError");
  const final = await owner.get("/api/tasks/" + id).expect(200);
  assert.equal(final.body.data.title, "History updated");
  assert.equal(final.body.data.history.length, 5);
});
