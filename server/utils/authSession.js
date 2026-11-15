const Role = require("../models/Role");
const RoleAssignment = require("../models/RoleAssignment");

function idString(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object") {
    if (value._id) {
      return value._id.toString();
    }
    if (value.id) {
      return value.id.toString();
    }
  }
  return value.toString();
}

function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "org";
}

async function resolveAccess(employee) {
  const assignmentRoleIds = await RoleAssignment.find({
    tenantId: employee.tenantId,
    employeeId: employee._id,
  }).distinct("roleId");

  const roleIdSet = new Set([
    ...(employee.roleIds || []).map(idString).filter(Boolean),
    ...assignmentRoleIds.map((id) => id.toString()),
  ]);

  const roles = await Role.find({
    _id: { $in: [...roleIdSet] },
    tenantId: employee.tenantId,
  }).lean();

  const roleNames = [];
  const resolvedRoleIds = [];
  let fullAccess = false;

  for (const role of roles) {
    roleNames.push(role.name);
    resolvedRoleIds.push(role._id.toString());
    if (role.fullAccess || (role.isSystem && role.name === "Admin")) {
      fullAccess = true;
    }
  }

  return {
    roles: roleNames,
    roleIds: resolvedRoleIds,
    fullAccess,
  };
}

function toSessionUser(employee, access) {
  return {
    id: employee._id.toString(),
    tenantId: idString(employee.tenantId),
    name: employee.name,
    username: employee.username,
    email: employee.email,
    departmentId: idString(employee.departmentId),
    isActive: employee.isActive,
    roles: access.roles,
    roleIds: access.roleIds || [],
    fullAccess: Boolean(access.fullAccess),
  };
}

async function buildSessionUser(employee) {
  const access = await resolveAccess(employee);
  return toSessionUser(employee, access);
}

module.exports = {
  slugify,
  resolveAccess,
  toSessionUser,
  buildSessionUser,
};

