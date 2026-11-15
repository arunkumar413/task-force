const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const PasswordOtp = require("../models/PasswordOtp");
const { sendMail, smtpConfigured } = require("../utils/mailer");
const { revokeOtherSessions } = require("../utils/sessionRegistry");
const { hashOtp, otpMatches, generateOtp, maskEmail } = require("../utils/otp");
const {
  PASSWORD_OTP_TTL_MS,
  PASSWORD_OTP_RESEND_MS,
  PASSWORD_OTP_MAX_ATTEMPTS,
  PASSWORD_MIN_LENGTH,
} = require("../constants");

module.exports.requestPasswordOtp = async function (req, res) {
  try {
    const employeeId = req.session.user.id;
    const tenantId = req.session.user.tenantId;
    const employee = await Employee.findOne({
      _id: employeeId,
      tenantId,
      isActive: true,
    });

    if (!employee) {
      return res.status(404).json({ statusMessage: "Employee not found" });
    }

    const recent = await PasswordOtp.findOne({
      employeeId,
      purpose: "password-change",
      usedAt: null,
    }).sort({ createdAt: -1 });

    if (
      recent &&
      Date.now() - new Date(recent.createdAt).getTime() < PASSWORD_OTP_RESEND_MS
    ) {
      const waitSeconds = Math.ceil(
        (PASSWORD_OTP_RESEND_MS -
          (Date.now() - new Date(recent.createdAt).getTime())) /
          1000
      );
      return res.status(429).json({
        statusMessage: `Wait ${waitSeconds} seconds before requesting another code`,
      });
    }

    await PasswordOtp.updateMany(
      { employeeId, purpose: "password-change", usedAt: null },
      { $set: { usedAt: new Date() } }
    );

    const code = generateOtp();
    await PasswordOtp.create({
      tenantId,
      employeeId,
      email: employee.email,
      purpose: "password-change",
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + PASSWORD_OTP_TTL_MS),
    });

    const mailBody = [
      `Your password change code is ${code}.`,
      "It expires in 10 minutes.",
      "If you did not request this, you can ignore this email.",
    ].join("\n");

    const mail = await sendMail({
      to: employee.email,
      subject: "Your password change code",
      text: mailBody,
    });

    if (!mail.delivered) {
      console.log(
        `[password-otp] ${employee.email} (${employee.username}): ${code}`
      );
    }

    res.json({
      statusMessage: mail.delivered
        ? `A code was sent to ${maskEmail(employee.email)}`
        : `A code was sent to ${maskEmail(employee.email)}. SMTP is not configured, so the code is also in the server log.`,
      data: {
        emailed: mail.delivered,
        smtpConfigured: smtpConfigured(),
        email: maskEmail(employee.email),
        expiresInSeconds: Math.floor(PASSWORD_OTP_TTL_MS / 1000),
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to send verification code" });
  }
};

module.exports.changePassword = async function (req, res) {
  try {
    const employeeId = req.session.user.id;
    const tenantId = req.session.user.tenantId;
    const otp = String(req.body.otp || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ statusMessage: "Enter the 6-digit code" });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        statusMessage: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ statusMessage: "Passwords do not match" });
    }

    const record = await PasswordOtp.findOne({
      employeeId,
      tenantId,
      email: req.session.user.email,
      purpose: "password-change",
      usedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) {
      return res.status(400).json({
        statusMessage: "No valid code. Request a new one.",
      });
    }

    if (record.attempts >= PASSWORD_OTP_MAX_ATTEMPTS) {
      record.usedAt = new Date();
      await record.save();
      return res.status(400).json({
        statusMessage: "Too many attempts. Request a new code.",
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
            : "Too many attempts. Request a new code.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const employee = await Employee.findOneAndUpdate(
      { _id: employeeId, tenantId, isActive: true },
      { password: hash },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ statusMessage: "Employee not found" });
    }

    record.usedAt = new Date();
    await record.save();

    await revokeOtherSessions(employeeId, req.sessionID, req.sessionStore);

    res.json({
      statusMessage: "Password updated. Other devices were signed out.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to change password" });
  }
};

