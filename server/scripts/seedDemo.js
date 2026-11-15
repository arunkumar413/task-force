const bcrypt = require("bcryptjs");
const { connectDB } = require("../DBConfig");
const Organization = require("../models/Organization");
const Department = require("../models/Department");
const Employee = require("../models/Employee");
const Role = require("../models/Role");
const RoleAssignment = require("../models/RoleAssignment");
const Permission = require("../models/Permission");
const {
  ensureCoreResources,
  setRoleResourcePermission,
  parsePermissionString,
} = require("../utils/accessControl");

const Todo = require("../models/Todo");
const TaskHistory = require("../models/TaskHistory");
const Comment = require("../models/Comment");
const TaskView = require("../models/TaskView");
const { fakeTaskData } = require("../dummyData/fakeTaskDataInsertIntoDB");

const DEMO_SLUG = "acme";
const DEMO_PASSWORD = "demo123";

const MANAGER_PERMISSIONS = [
  "employee.read",
  "employee.write",
  "task.read",
  "task.write",
  "task.update",
  "task.delete",
  "department.read",
];

const EMPLOYEE_PERMISSIONS = [
  "employee.read",
  "task.read",
  "task.write",
  "task.update",
];

const HR_PERMISSIONS = [
  "employee.read",
  "employee.write",
  "employee.update",
  "department.read",
  "task.read",
];

async function grantPermissionStrings(tenantId, roleId, permissionStrings) {
  const byResource = new Map();
  for (const value of permissionStrings) {
    const parsed = parsePermissionString(value);
    if (!parsed) {
      continue;
    }
    const actions = byResource.get(parsed.resource) || [];
    actions.push(parsed.action);
    byResource.set(parsed.resource, actions);
  }

  for (const [resourceKey, actions] of byResource.entries()) {
    await setRoleResourcePermission({
      tenantId,
      roleId,
      resourceKey,
      actions,
    });
  }
}

async function clearDemoOrg() {
  const existing = await Organization.findOne({ slug: DEMO_SLUG });
  if (!existing) {
    return;
  }

  const tenantId = existing._id;
  await Todo.deleteMany({ tenantId });
  await Promise.all([Comment.deleteMany({ tenantId }), TaskHistory.deleteMany({ tenantId })]);
  await TaskView.deleteMany({ tenantId });
  await Permission.deleteMany({ tenantId });
  await RoleAssignment.deleteMany({ tenantId });
  await Employee.deleteMany({ tenantId });
  await Department.deleteMany({ tenantId });
  await Role.deleteMany({ tenantId });
  await Organization.deleteOne({ _id: tenantId });
}

async function hashPassword() {
  return bcrypt.hash(DEMO_PASSWORD, 10);
}

async function assignRole(tenantId, employee, role) {
  employee.roleIds = [role._id];
  await employee.save();
  await RoleAssignment.create({
    tenantId,
    employeeId: employee._id,
    roleId: role._id,
    scope: { type: "global" },
  });
}

async function seed() {
  await connectDB();
  await clearDemoOrg();
  await ensureCoreResources();

  const password = await hashPassword();
  const organization = await Organization.create({
    name: "Acme Corp",
    slug: DEMO_SLUG,
    plan: "business",
  });
  const tenantId = organization._id;

  const [adminRole, managerRole, employeeRole, hrRole] = await Role.create([
    {
      tenantId,
      name: "Admin",
      description: "Organization administrator",
      fullAccess: true,
      isSystem: true,
    },
    {
      tenantId,
      name: "Manager",
      description: "Department or team manager",
    },
    {
      tenantId,
      name: "Employee",
      description: "Standard team member",
    },
    {
      tenantId,
      name: "HR",
      description: "People operations",
    },
  ]);

  await grantPermissionStrings(tenantId, managerRole._id, MANAGER_PERMISSIONS);
  await grantPermissionStrings(tenantId, employeeRole._id, EMPLOYEE_PERMISSIONS);
  await grantPermissionStrings(tenantId, hrRole._id, HR_PERMISSIONS);

  const engineering = await Department.create({
    tenantId,
    name: "Engineering",
  });
  const leadership = await Department.create({
    tenantId,
    name: "Leadership",
  });
  const product = await Department.create({
    tenantId,
    name: "Product",
  });
  const people = await Department.create({
    tenantId,
    name: "People",
  });
  const backend = await Department.create({
    tenantId,
    name: "Backend",
    parentId: engineering._id,
  });
  const frontend = await Department.create({
    tenantId,
    name: "Frontend",
    parentId: engineering._id,
  });
  const qa = await Department.create({
    tenantId,
    name: "QA",
    parentId: engineering._id,
  });

  const ava = await Employee.create({
    tenantId,
    name: "Ava Chen",
    username: "ava.chen",
    email: "ava.chen@acme.example",
    designation: "Chief Executive Officer",
    phone: "+1-555-0100",
    password,
    departmentId: leadership._id,
  });
  await assignRole(tenantId, ava, adminRole);

  const marcus = await Employee.create({
    tenantId,
    name: "Marcus Webb",
    username: "marcus.webb",
    email: "marcus.webb@acme.example",
    designation: "VP Engineering",
    phone: "+1-555-0101",
    password,
    departmentId: engineering._id,
    managerId: ava._id,
  });
  await assignRole(tenantId, marcus, managerRole);

  const priya = await Employee.create({
    tenantId,
    name: "Priya Shah",
    username: "priya.shah",
    email: "priya.shah@acme.example",
    designation: "Engineering Manager",
    phone: "+1-555-0102",
    password,
    departmentId: backend._id,
    managerId: marcus._id,
  });
  await assignRole(tenantId, priya, managerRole);

  const liam = await Employee.create({
    tenantId,
    name: "Liam Ortiz",
    username: "liam.ortiz",
    email: "liam.ortiz@acme.example",
    designation: "Backend Engineer",
    phone: "+1-555-0103",
    password,
    departmentId: backend._id,
    managerId: priya._id,
  });
  await assignRole(tenantId, liam, employeeRole);

  const sofia = await Employee.create({
    tenantId,
    name: "Sofia Berg",
    username: "sofia.berg",
    email: "sofia.berg@acme.example",
    designation: "Frontend Lead",
    phone: "+1-555-0104",
    password,
    departmentId: frontend._id,
    managerId: marcus._id,
  });
  await assignRole(tenantId, sofia, managerRole);

  const noah = await Employee.create({
    tenantId,
    name: "Noah Kim",
    username: "noah.kim",
    email: "noah.kim@acme.example",
    designation: "Frontend Engineer",
    phone: "+1-555-0105",
    password,
    departmentId: frontend._id,
    managerId: sofia._id,
  });
  await assignRole(tenantId, noah, employeeRole);

  const elena = await Employee.create({
    tenantId,
    name: "Elena Rossi",
    username: "elena.rossi",
    email: "elena.rossi@acme.example",
    designation: "QA Engineer",
    phone: "+1-555-0106",
    password,
    departmentId: qa._id,
    managerId: marcus._id,
  });
  await assignRole(tenantId, elena, employeeRole);

  const jordan = await Employee.create({
    tenantId,
    name: "Jordan Hale",
    username: "jordan.hale",
    email: "jordan.hale@acme.example",
    designation: "Product Manager",
    phone: "+1-555-0107",
    password,
    departmentId: product._id,
    managerId: ava._id,
  });
  await assignRole(tenantId, jordan, managerRole);

  const sam = await Employee.create({
    tenantId,
    name: "Sam Okonkwo",
    username: "sam.okonkwo",
    email: "sam.okonkwo@acme.example",
    designation: "People Operations Lead",
    phone: "+1-555-0108",
    password,
    departmentId: people._id,
    managerId: ava._id,
  });
  await assignRole(tenantId, sam, hrRole);

  // The original numeric creator IDs map to these demo employees.
  const creators = { 1: ava, 2: marcus, 3: liam };
  const departmentPaths = new Map((await require("../utils/taskDepartments").departmentOptions(tenantId)).map(item => [item.id, item.path]));
  await Todo.insertMany(fakeTaskData.map(task => ({
    title: task.title, description: task.description, priority: task.priority,
    status: task.status, dueDate: task.due_date, tenantId,
    createdBy: creators[task.created_by]._id,
    employee: creators[task.created_by]._id,
    departmentId: creators[task.created_by].departmentId,
    departmentLabel: departmentPaths.get(String(creators[task.created_by].departmentId)),
    labels: [departmentPaths.get(String(creators[task.created_by].departmentId))],
  })));
  const seededTasks = await Todo.find({ tenantId }).select("_id createdBy");
  await TaskHistory.insertMany(seededTasks.map(task => ({ tenantId, taskId: task._id, actor: task.createdBy,
    actorName: creators[Object.keys(creators).find(key => String(creators[key]._id) === String(task.createdBy))]?.name || "Demo user",
    action: "created", occurredAt: new Date(), changes: [] })));
  console.log("Demo organization and Task Force tasks seeded.");
  console.log("");
  console.log("Organization: Acme Corp");
  console.log("Slug:         acme");
  console.log("");
  console.log("Departments:");
  console.log("  Engineering");
  console.log("    Backend");
  console.log("    Frontend");
  console.log("    QA");
  console.log("  Product");
  console.log("  People");
  console.log("");
  console.log("Login (password for all: demo123)");
  console.log("  Admin    ava.chen@acme.example");
  console.log("  Manager  marcus.webb@acme.example");
  console.log("  Employee liam.ortiz@acme.example");
  console.log("  HR       sam.okonkwo@acme.example");
  console.log("");
  console.log("If an email is in more than one org, use organization slug: acme");

  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

