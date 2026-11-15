const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
const PasswordOtp = require("../models/PasswordOtp");
const Department = require("../models/Department");
const Organization = require("../models/Organization");
const { buildSessionUser } = require("../utils/authSession");
const {
  upsertAuthSession,
  listEmployeeSessions,
} = require("../utils/sessionRegistry");
const { listGrantsForRoles } = require("../utils/accessControl");

function idString(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }
  return value.toString();
}

function serializeProfile(employee, organization) {
  return {
    id: employee._id.toString(),
    name: employee.name,
    username: employee.username,
    email: employee.email,
    designation: employee.designation || "",
    phone: employee.phone || "",
    departmentId: idString(employee.departmentId),
    departmentName:
      employee.departmentId && employee.departmentId.name
        ? employee.departmentId.name
        : null,
    managerId: idString(employee.managerId),
    managerName:
      employee.managerId && employee.managerId.name
        ? employee.managerId.name
        : null,
    organization: organization
      ? {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
        }
      : null,
    roles: (employee.roleIds || [])
      .map(function (role) {
        return role && role.name ? role.name : null;
      })
      .filter(Boolean),
  };
}

module.exports.getProfile = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const employeeId = req.session.user.id;

    const [employee, organization, departments] = await Promise.all([
      Employee.findOne({ _id: employeeId, tenantId, isActive: true })
        .select("-password")
        .populate("departmentId", "name")
        .populate("managerId", "name")
        .populate("roleIds", "name"),
      Organization.findById(tenantId).lean(),
      Department.find({ tenantId }).sort({ name: 1 }).lean(),
    ]);

    if (!employee) {
      return res.status(404).json({ statusMessage: "Employee not found" });
    }

    await upsertAuthSession(req, { force: true });
    const sessions = await listEmployeeSessions(employeeId, req.sessionID);
    const fullAccess = Boolean(req.session.user.fullAccess);
    const grants = fullAccess
      ? []
      : await listGrantsForRoles(req.session.user.roleIds || []);

    res.json({
      data: {
        employee: serializeProfile(employee, organization),
        departments: departments.map(function (department) {
          return {
            id: department._id.toString(),
            name: department.name,
          };
        }),
        sessions,
        access: {
          fullAccess,
          grants,
        },
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to load profile" });
  }
};

module.exports.updateProfile = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const employeeId = req.session.user.id;
    const name = String(req.body.name || "").trim();
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const designation = String(req.body.designation || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!name || !username || !email) {
      return res.status(400).json({
        statusMessage: "name, username, and email are required",
      });
    }

    const current = await Employee.findOne({ _id: employeeId, tenantId, isActive: true });
    if (!current) return res.status(401).json({ statusMessage: "Account is no longer active" });
    const emailChanged = current.email !== email;
    if (emailChanged) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
        return res.status(400).json({ statusMessage: "Enter a valid email address" });
      }
      if (typeof req.body.currentPassword !== "string" || !await bcrypt.compare(req.body.currentPassword, current.password)) {
        return res.status(403).json({ statusMessage: "Enter your current password to change your email" });
      }
    }

    const duplicate = await Employee.findOne({
      tenantId,
      _id: { $ne: employeeId },
      $or: [{ email }, { username }],
    });

    if (duplicate) {
      return res.status(400).json({
        statusMessage: "Email or username is already in use",
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, tenantId, isActive: true, email: current.email, password: current.password },
      {
        name,
        username,
        email,
        designation,
        phone,
      },
      { new: true, runValidators: true }
    )
      .select("-password")
      .populate("departmentId", "name")
      .populate("managerId", "name")
      .populate("roleIds", "name");

    if (!employee) {
      return res.status(404).json({ statusMessage: "Employee not found" });
    }

    const organization = await Organization.findById(tenantId).lean();
    const sessionUser = await buildSessionUser(employee);

    if (emailChanged) {
      await PasswordOtp.updateMany({ employeeId, tenantId, usedAt: null }, { $set: { usedAt: new Date() } });
      await new Promise((resolve, reject) => req.session.regenerate(err => err ? reject(err) : resolve()));
    }

    req.session.user = sessionUser;
    req.session.save(function (err) {
      if (err) {
        return res.status(500).json({ statusMessage: "Session save failed" });
      }
      res.json({
        statusMessage: "Profile updated",
        data: {
          employee: serializeProfile(employee, organization),
          session: sessionUser,
        },
      });
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({
        statusMessage: "Email or username is already in use",
      });
    }
    res.status(500).json({ statusMessage: "Unable to update profile" });
  }
};

