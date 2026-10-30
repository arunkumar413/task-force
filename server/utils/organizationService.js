const bcrypt = require("bcryptjs");
const Organization = require("../models/Organization");
const Role = require("../models/Role");
const Employee = require("../models/Employee");
const RoleAssignment = require("../models/RoleAssignment");
const Department = require("../models/Department");
const { slugify } = require("./authSession");
const {
  ensureCoreResources,
  setRoleResourcePermission,
} = require("./accessControl");

async function provisionOrganization({
  name,
  slug,
  plan,
  topLevelDepartmentName,
  allowSlugCollision = true,
}) {
  const orgName = String(name || "").trim();
  if (!orgName) {
    const err = new Error("Organization name is required");
    err.status = 400;
    throw err;
  }

  let orgSlug = slugify(slug || orgName);
  const existing = await Organization.findOne({ slug: orgSlug });
  if (existing) {
    if (!allowSlugCollision) {
      const err = new Error("Organization slug already exists");
      err.status = 400;
      throw err;
    }
    orgSlug = `${orgSlug}-${Date.now().toString(36)}`;
  }

  const organization = await Organization.create({
    name: orgName,
    slug: orgSlug,
    plan: plan || "free",
  });

  await ensureCoreResources();

  const [adminRole, managerRole, employeeRole] = await Role.create([
    {
      tenantId: organization._id,
      name: "Admin",
      description: "Organization administrator",
      fullAccess: true,
      isSystem: true,
    },
    {
      tenantId: organization._id,
      name: "Manager",
      description: "Department or team manager",
    },
    {
      tenantId: organization._id,
      name: "Employee",
      description: "Standard team member",
    },
  ]);

  await setRoleResourcePermission({
    tenantId: organization._id,
    roleId: managerRole._id,
    resourceKey: "employee",
    actions: ["read", "write"],
  });
  await setRoleResourcePermission({
    tenantId: organization._id,
    roleId: employeeRole._id,
    resourceKey: "employee",
    actions: ["read"],
  });

  for (const role of [managerRole, employeeRole]) {
    await setRoleResourcePermission({ tenantId: organization._id, roleId: role._id, resourceKey: "task", actions: ["read", "write", "update", "delete"] });
  }

  const department = await Department.create({
    tenantId: organization._id,
    name: String(topLevelDepartmentName || "Leadership").trim() || "Leadership",
  });

  return { organization, adminRole, managerRole, employeeRole, department };
}

async function createOrgAdmin({
  organization,
  adminRole,
  department,
  username,
  email,
  password,
}) {
  if (!username || !email || !password) {
    const err = new Error("Admin username, email, and password are required");
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const employee = await Employee.create({
    tenantId: organization._id,
    name: username,
    username,
    email,
    password: hash,
    departmentId: department._id,
    roleIds: [adminRole._id],
  });

  await RoleAssignment.create({
    tenantId: organization._id,
    employeeId: employee._id,
    roleId: adminRole._id,
    scope: { type: "global" },
  });

  return employee;
}

module.exports = {
  provisionOrganization,
  createOrgAdmin,
};

