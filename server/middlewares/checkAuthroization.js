const Employee = require("../models/Employee");
const {
  hasResourceAccess,
  parsePermissionString,
} = require("../utils/accessControl");
const { buildSessionUser } = require("../utils/authSession");

async function sessionWithAccess(req) {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    return null;
  }
  if (sessionUser.fullAccess || (sessionUser.roleIds && sessionUser.roleIds.length > 0)) {
    return sessionUser;
  }
  if (!sessionUser.id) {
    return sessionUser;
  }

  const employee = await Employee.findById(sessionUser.id);
  if (!employee || !employee.isActive) {
    return sessionUser;
  }

  const rebuilt = await buildSessionUser(employee);
  req.session.user = Object.assign({}, sessionUser, rebuilt);
  return req.session.user;
}

module.exports.checkAuthorization = function (accessCheckObj) {
  return async function (req, res, next) {
    try {
      const sessionUser = await sessionWithAccess(req);
      if (!sessionUser) {
        return res.status(401).json({ statusMessage: "Session not found" });
      }

      const userRoles = sessionUser.roles || [];
      const requiredRoles =
        accessCheckObj.rolesWithAccess || accessCheckObj.roles || [];

      const hasRole =
        requiredRoles.length === 0 ||
        userRoles.some((role) => requiredRoles.includes(role));

      if (!hasRole) {
        return res.status(403).json({ statusMessage: "Authorization failed" });
      }

      const hasResource = Boolean(accessCheckObj.resource);
      const hasAction = Boolean(accessCheckObj.action);
      if (hasResource !== hasAction) {
        return res.status(500).json({
          statusMessage: "Authorization check misconfigured",
        });
      }

      const checks = [];
      if (hasResource && hasAction) {
        checks.push({
          resourceKey: accessCheckObj.resource,
          action: accessCheckObj.action,
        });
      }

      const permissionStrings = accessCheckObj.permissions || [];
      for (const permission of permissionStrings) {
        const parsed = parsePermissionString(permission);
        if (parsed) {
          checks.push({
            resourceKey: parsed.resource,
            action: parsed.action,
          });
        }
      }

      if (permissionStrings.length > 0 && checks.length === 0) {
        return res.status(403).json({ statusMessage: "Authorization failed" });
      }

      if (checks.length === 0) {
        return next();
      }

      for (const check of checks) {
        const allowed = await hasResourceAccess({
          tenantId: sessionUser.tenantId,
          roleIds: sessionUser.roleIds || [],
          fullAccess: sessionUser.fullAccess,
          resourceKey: check.resourceKey,
          action: check.action,
        });
        if (allowed) {
          return next();
        }
      }

      res.status(403).json({ statusMessage: "Authorization failed" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ statusMessage: "Authorization check failed" });
    }
  };
};

