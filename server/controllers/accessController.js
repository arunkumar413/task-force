const Employee = require("../models/Employee");
const Role = require("../models/Role");
const RoleAssignment = require("../models/RoleAssignment");
const Permission = require("../models/Permission");
const Resource = require("../models/Resource");
const { RESOURCE_ACTIONS } = require("../constants");
const {
  setRoleResourcePermission,
  grantedActions,
} = require("../utils/accessControl");

function idString(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }
  return value.toString();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function countOtherAdmins(tenantId, excludeEmployeeId) {
  const adminRoles = await Role.find({
    tenantId,
    fullAccess: true,
  }).select("_id");
  const adminRoleIds = adminRoles.map(function (role) {
    return role._id;
  });
  if (adminRoleIds.length === 0) {
    return 0;
  }
  return Employee.countDocuments({
    tenantId,
    isActive: true,
    _id: { $ne: excludeEmployeeId },
    roleIds: { $in: adminRoleIds },
  });
}

module.exports.getAccessCatalog = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const [roles, permissions] = await Promise.all([
      Role.find({ tenantId }).sort({ name: 1 }).lean(),
      Permission.find({ tenantId }).lean(),
    ]);

    const grantsByRole = {};
    for (const permission of permissions) {
      const roleId = idString(permission.role);
      const resourceId = idString(permission.resource);
      if (!roleId || !resourceId) {
        continue;
      }
      grantsByRole[roleId] = grantsByRole[roleId] || {};
      grantsByRole[roleId][resourceId] = grantedActions(permission);
    }

    res.json({
      data: {
        actions: RESOURCE_ACTIONS,
        roles: roles.map(function (role) {
          return {
            id: role._id.toString(),
            name: role.name,
            description: role.description || "",
            fullAccess: Boolean(role.fullAccess),
            isSystem: Boolean(role.isSystem),
            grants: grantsByRole[role._id.toString()] || {},
          };
        }),
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to load access settings" });
  }
};

module.exports.getAccessResources = async function (req, res) {
  try {
    const query = String(req.query.search || "").trim();
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number.parseInt(req.query.pageSize, 10) || 10, 1),
      50
    );
    const filter = query
      ? {
          $or: [
            { key: new RegExp(escapeRegex(query), "i") },
            { name: new RegExp(escapeRegex(query), "i") },
          ],
        }
      : {};

    const [total, resources] = await Promise.all([
      Resource.countDocuments(filter),
      Resource.find(filter)
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      data: {
        resources: resources.map(function (resource) {
          return {
            id: resource._id.toString(),
            key: resource.key,
            name: resource.name,
            description: resource.description || "",
          };
        }),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
        },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to load access resources" });
  }
};

function serializeMember(person) {
  return {
    id: person._id.toString(),
    name: person.name,
    email: person.email,
    designation: person.designation || "",
    departmentName:
      person.departmentId && person.departmentId.name
        ? person.departmentId.name
        : "Company-wide",
    roleIds: (person.roleIds || []).map(function (role) {
      return idString(role);
    }),
    roles: (person.roleIds || [])
      .map(function (role) {
        return role && role.name ? role.name : null;
      })
      .filter(Boolean),
  };
}

module.exports.getAccessMembers = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const search = String(req.query.search || "").trim();
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number.parseInt(req.query.pageSize, 10) || 10, 1),
      50
    );
    const filter = { tenantId, isActive: true };

    if (search) {
      const searchPattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: searchPattern }, { email: searchPattern }];
    }

    const [total, employees] = await Promise.all([
      Employee.countDocuments(filter),
      Employee.find(filter)
        .select("name email designation departmentId roleIds")
        .populate("departmentId", "name")
        .populate("roleIds", "name fullAccess")
        .sort({ name: 1, _id: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      data: {
        members: employees.map(serializeMember),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(Math.ceil(total / pageSize), 1),
        },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to load members" });
  }
};

module.exports.updateRoleResource = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const roleId = req.params.roleId;
    const resourceKey = String(req.body.resourceKey || "").trim();
    const actions = Array.isArray(req.body.actions) ? req.body.actions : [];

    const role = await Role.findOne({ _id: roleId, tenantId });
    if (!role) {
      return res.status(404).json({ statusMessage: "Role not found" });
    }
    if (role.fullAccess) {
      return res.status(400).json({
        statusMessage: "Admin already has access to every resource",
      });
    }

    const resource = await Resource.findOne({ key: resourceKey });
    if (!resource) {
      return res.status(400).json({ statusMessage: "Unknown resource" });
    }

    const allowedActions = actions.filter(function (action) {
      return RESOURCE_ACTIONS.includes(action);
    });

    await setRoleResourcePermission({
      tenantId,
      roleId: role._id,
      resourceKey,
      actions: allowedActions,
    });

    res.json({
      statusMessage: `Updated ${role.name} access to ${resource.name}`,
      data: {
        roleId: role._id.toString(),
        resourceKey,
        actions: allowedActions,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to update role access" });
  }
};

module.exports.setMemberRole = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const actorId = req.session.user.id;
    const employeeId = req.params.employeeId;
    const roleId = String(req.body.roleId || "").trim();

    if (!roleId) {
      return res.status(400).json({ statusMessage: "Choose a role" });
    }

    const [employee, role] = await Promise.all([
      Employee.findOne({ _id: employeeId, tenantId, isActive: true }),
      Role.findOne({ _id: roleId, tenantId }),
    ]);

    if (!employee) {
      return res.status(404).json({ statusMessage: "Employee not found" });
    }
    if (!role) {
      return res.status(400).json({ statusMessage: "Role not found" });
    }

    const currentlyAdmin = await Role.exists({
      tenantId,
      fullAccess: true,
      _id: { $in: employee.roleIds || [] },
    });
    if (currentlyAdmin && !role.fullAccess) {
      const others = await countOtherAdmins(tenantId, employee._id);
      if (others === 0) {
        return res.status(400).json({
          statusMessage: "Keep at least one Admin in the organization",
        });
      }
    }

    employee.roleIds = [role._id];
    await employee.save();
    await RoleAssignment.deleteMany({ tenantId, employeeId: employee._id });
    await RoleAssignment.create({
      tenantId,
      employeeId: employee._id,
      roleId: role._id,
      scope: { type: "global" },
    });

    res.json({
      statusMessage:
        employeeId === actorId
          ? `Your role is now ${role.name}. Sign in again if access looks stale.`
          : `${employee.name} is now ${role.name}`,
      data: {
        employeeId: employee._id.toString(),
        roleId: role._id.toString(),
        roleName: role.name,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to assign role" });
  }
};

