const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Role = require("../models/Role");
const RoleAssignment = require("../models/RoleAssignment");
const Organization = require("../models/Organization");
const Department = require("../models/Department");
const PasswordOtp = require("../models/PasswordOtp");
const { sendMail, smtpConfigured } = require("../utils/mailer");
const { hashOtp, otpMatches, generateOtp, maskEmail } = require("../utils/otp");
const { slugify } = require("../utils/authSession");
const {
  INVITE_OTP_TTL_MS,
  INVITE_MAX_ROWS,
  PASSWORD_OTP_MAX_ATTEMPTS,
  PASSWORD_MIN_LENGTH,
} = require("../constants");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRow(row, index) {
  const name = String((row && row.name) || "").trim();
  const email = String((row && row.email) || "")
    .toLowerCase()
    .trim();
  const designation = String((row && row.designation) || "").trim();
  const phone = String((row && row.phone) || "").trim();
  return { index: index + 1, name, email, designation, phone };
}

function usernameFromEmail(email) {
  const local = String(email || "")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .slice(0, 80);
  return local || "user";
}

async function uniqueUsername(tenantId, base) {
  let candidate = base;
  let suffix = 0;
  while (
    await Employee.exists({
      tenantId,
      username: candidate,
    })
  ) {
    suffix += 1;
    candidate = `${base}${suffix}`.slice(0, 100);
  }
  return candidate;
}

async function sendInviteCode({ tenantId, employee, organization }) {
  await PasswordOtp.updateMany(
    { employeeId: employee._id, purpose: "invite", usedAt: null },
    { $set: { usedAt: new Date() } }
  );

  const code = generateOtp();
  await PasswordOtp.create({
    tenantId,
    employeeId: employee._id,
    email: employee.email,
    purpose: "invite",
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + INVITE_OTP_TTL_MS),
  });

  const orgName = organization?.name || "your organization";
  const mailBody = [
    `You were invited to ${orgName}.`,
    `Your invite code is ${code}.`,
    "It expires in 24 hours.",
    "Use it on the Accept invite page to set your password.",
  ].join("\n");

  const mail = await sendMail({
    to: employee.email,
    subject: `You're invited to ${orgName}`,
    text: mailBody,
  });

  if (!mail.delivered) {
    console.log(
      `[invite-otp] ${employee.email} (${employee.username}): ${code}`
    );
  }

  return mail;
}

module.exports.bulkInviteEmployees = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const actorId = req.session.user.id;
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    const requestedDepartmentId = String(req.body.departmentId || "").trim();
    const requestedRoleName = String(req.body.roleName || "Employee").trim();

    if (rows.length === 0) {
      return res.status(400).json({ statusMessage: "Upload at least one row" });
    }
    if (rows.length > INVITE_MAX_ROWS) {
      return res.status(400).json({
        statusMessage: `Upload at most ${INVITE_MAX_ROWS} rows at a time`,
      });
    }

    const actor = await Employee.findOne({
      _id: actorId,
      tenantId,
      isActive: true,
    });

    if (!actor) {
      return res.status(404).json({ statusMessage: "Employee not found" });
    }
    if (!actor.departmentId) {
      return res.status(403).json({
        statusMessage: "You must belong to a department to invite teammates",
      });
    }

    if (!["Employee", "Manager"].includes(requestedRoleName)) {
      return res.status(400).json({
        statusMessage: "Invite role must be Employee or Manager",
      });
    }

    const employeeRole = await Role.findOne({
      tenantId,
      name: requestedRoleName,
    });
    if (!employeeRole) {
      return res.status(400).json({
        statusMessage: "Employee role is not set up for this organization",
      });
    }

    const departmentQuery = {
      tenantId,
      ...(requestedDepartmentId
        ? { _id: requestedDepartmentId }
        : { _id: actor.departmentId }),
    };
    if (!req.session.user.fullAccess && requestedDepartmentId) {
      departmentQuery.$or = [
        { _id: actor.departmentId },
        { ancestors: actor.departmentId },
      ];
    }
    const targetDepartment = await Department.findOne(departmentQuery).lean();
    if (!targetDepartment) {
      return res.status(403).json({
        statusMessage:
          "You can invite only into your department or one of its child departments",
      });
    }

    const organization = await Organization.findById(tenantId).lean();
    const parsed = rows.map(normalizeRow);
    const emailsInFile = new Set();
    const created = [];
    const errors = [];

    for (const row of parsed) {
      if (!row.name) {
        errors.push({ row: row.index, email: row.email, message: "Name is required" });
        continue;
      }
      if (!EMAIL_PATTERN.test(row.email)) {
        errors.push({
          row: row.index,
          email: row.email,
          message: "Valid email is required",
        });
        continue;
      }
      if (emailsInFile.has(row.email)) {
        errors.push({
          row: row.index,
          email: row.email,
          message: "Duplicate email in this file",
        });
        continue;
      }
      emailsInFile.add(row.email);

      const existing = await Employee.findOne({
        tenantId,
        email: row.email,
      }).select("_id");
      if (existing) {
        errors.push({
          row: row.index,
          email: row.email,
          message: "Email already exists in this organization",
        });
        continue;
      }

      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), salt);
      const username = await uniqueUsername(
        tenantId,
        usernameFromEmail(row.email)
      );

      const employee = await Employee.create({
        tenantId,
        name: row.name,
        username,
        email: row.email,
        designation: row.designation,
        phone: row.phone,
        password,
        departmentId: targetDepartment._id,
        managerId: actor._id,
        roleIds: [employeeRole._id],
        mustSetPassword: true,
      });

      await RoleAssignment.create({
        tenantId,
        employeeId: employee._id,
        roleId: employeeRole._id,
        scope: { type: "global" },
      });

      const mail = await sendInviteCode({ tenantId, employee, organization });
      created.push({
        row: row.index,
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        username: employee.username,
        emailed: mail.delivered,
        smtpConfigured: smtpConfigured(),
      });
    }

    res.status(created.length ? 201 : 400).json({
      statusMessage:
        created.length === 0
          ? "No one was invited"
          : `Invited ${created.length} teammate${created.length === 1 ? "" : "s"} to ${
              organization?.name || "your department"
            }`,
      data: {
        departmentId: targetDepartment._id.toString(),
        managerId: actor._id.toString(),
        roleName: employeeRole.name,
        created,
        errors,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to invite employees" });
  }
};

module.exports.acceptInvite = async function (req, res) {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const otp = String(req.body.otp || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    const organizationSlug = String(req.body.organizationSlug || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        statusMessage: "Email and the 6-digit invite code are required",
      });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        statusMessage: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ statusMessage: "Passwords do not match" });
    }

    let employee;
    if (organizationSlug) {
      const organization = await Organization.findOne({
        slug: slugify(organizationSlug),
      });
      if (!organization) {
        return res.status(400).json({ statusMessage: "Organization not found" });
      }
      employee = await Employee.findOne({
        tenantId: organization._id,
        email,
        isActive: true,
      });
    } else {
      const matches = await Employee.find({ email, isActive: true });
      if (matches.length > 1) {
        return res.status(400).json({
          statusMessage: "Specify organization slug to choose a tenant",
        });
      }
      employee = matches[0];
    }

    if (!employee || !employee.mustSetPassword) {
      return res.status(400).json({
        statusMessage: "No pending invite for this email",
      });
    }

    const record = await PasswordOtp.findOne({
      employeeId: employee._id,
      tenantId: employee.tenantId,
      purpose: "invite",
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        statusMessage: "No valid invite code. Ask your manager to invite you again.",
      });
    }

    if (record.attempts >= PASSWORD_OTP_MAX_ATTEMPTS) {
      record.usedAt = new Date();
      await record.save();
      return res.status(400).json({
        statusMessage: "Too many attempts. Ask your manager to invite you again.",
      });
    }

    if (!otpMatches(otp, record.codeHash)) {
      record.attempts += 1;
      await record.save();
      const remaining = PASSWORD_OTP_MAX_ATTEMPTS - record.attempts;
      return res.status(400).json({
        statusMessage:
          remaining > 0
            ? `Invalid code. ${remaining} attempts left.`
            : "Too many attempts. Ask your manager to invite you again.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    employee.password = await bcrypt.hash(password, salt);
    employee.mustSetPassword = false;
    await employee.save();

    record.usedAt = new Date();
    await record.save();

    res.json({
      statusMessage: "Password saved. You can sign in now.",
      data: { email: maskEmail(employee.email) },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to accept invite" });
  }
};

