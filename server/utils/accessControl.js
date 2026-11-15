const Resource = require("../models/Resource");
const Permission = require("../models/Permission");
const Role = require("../models/Role");
const { RESOURCE_ACTIONS, CORE_RESOURCES } = require("../constants");

function parsePermissionString(value) {
  const text = String(value || "").trim();
  const lastDot = text.lastIndexOf(".");
  if (lastDot <= 0) {
    return null;
  }
  const resource = text.slice(0, lastDot);
  const action = text.slice(lastDot + 1);
  if (!resource || !RESOURCE_ACTIONS.includes(action)) {
    return null;
  }
  return { resource, action };
}

function grantedActions(permission) {
  return RESOURCE_ACTIONS.filter(function (action) {
    return Boolean(permission && permission[action]);
  });
}

function actionFlags(actions) {
  const flags = {
    read: false,
    write: false,
    update: false,
    delete: false,
  };
  for (const action of actions || []) {
    if (RESOURCE_ACTIONS.includes(action)) {
      flags[action] = true;
    }
  }
  return flags;
}

async function ensureCoreResources() {
  const resources = [];
  for (const item of CORE_RESOURCES) {
    const resource = await Resource.findOneAndUpdate(
      { key: item.key },
      {
        $set: {
          name: item.name,
          description: item.description || "",
          actions: RESOURCE_ACTIONS.slice(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    resources.push(resource);
  }
  return resources;
}

async function setRoleResourcePermission({
  tenantId,
  roleId,
  resourceKey,
  actions,
}) {
  const resource = await Resource.findOne({ key: resourceKey });
  if (!resource) {
    const err = new Error(`Unknown resource: ${resourceKey}`);
    err.status = 400;
    throw err;
  }

  return Permission.findOneAndUpdate(
    { role: roleId, resource: resource._id },
    {
      tenantId,
      role: roleId,
      resource: resource._id,
      ...actionFlags(actions),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function hasResourceAccess({
  tenantId,
  roleIds,
  fullAccess,
  resourceKey,
  action,
}) {
  if (fullAccess) {
    return true;
  }
  if (!resourceKey || !RESOURCE_ACTIONS.includes(action)) {
    return false;
  }
  if (!roleIds || roleIds.length === 0) {
    return false;
  }

  const resource = await Resource.findOne({ key: resourceKey })
    .select("_id")
    .lean();
  if (!resource) {
    return false;
  }

  const filter = {
    role: { $in: roleIds },
    resource: resource._id,
  };
  if (tenantId) {
    filter.tenantId = tenantId;
  }
  filter[action] = true;
  if (await Permission.exists(filter)) {
    return true;
  }

  const roles = await Role.find({ _id: { $in: roleIds } })
    .select("name isSystem fullAccess permissions")
    .lean();
  const needle = `${resourceKey}.${action}`;
  return roles.some(function (role) {
    return (
      role.fullAccess ||
      (role.isSystem && role.name === "Admin") ||
      (role.permissions || []).includes(needle)
    );
  });
}

async function listGrantsForRoles(roleIds) {
  if (!roleIds || roleIds.length === 0) {
    return [];
  }

  const permissions = await Permission.find({
    role: { $in: roleIds },
  })
    .populate("resource", "key name description")
    .lean();

  const byKey = new Map();

  if (permissions.length === 0) {
    const roles = await Role.find({ _id: { $in: roleIds } })
      .select("permissions")
      .lean();
    for (const role of roles) {
      for (const value of role.permissions || []) {
        const parsed = parsePermissionString(value);
        if (!parsed) {
          continue;
        }
        const current = byKey.get(parsed.resource) || {
          key: parsed.resource,
          name: parsed.resource,
          description: "",
          actions: new Set(),
        };
        current.actions.add(parsed.action);
        byKey.set(parsed.resource, current);
      }
    }
  }
  for (const permission of permissions) {
    if (!permission.resource || !permission.resource.key) {
      continue;
    }
    const key = permission.resource.key;
    const current = byKey.get(key) || {
      key,
      name: permission.resource.name,
      description: permission.resource.description || "",
      actions: new Set(),
    };
    for (const action of grantedActions(permission)) {
      current.actions.add(action);
    }
    byKey.set(key, current);
  }

  return [...byKey.values()]
    .map(function (item) {
      return {
        key: item.key,
        name: item.name,
        description: item.description,
        actions: RESOURCE_ACTIONS.filter(function (action) {
          return item.actions.has(action);
        }),
      };
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
}

module.exports = {
  parsePermissionString,
  grantedActions,
  ensureCoreResources,
  setRoleResourcePermission,
  hasResourceAccess,
  listGrantsForRoles,
};

