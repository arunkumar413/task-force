const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const Organization = require("../models/Organization");
const { slugify, buildSessionUser } = require("../utils/authSession");
const {
  forgetSession,
  upsertAuthSession,
} = require("../utils/sessionRegistry");
const {
  provisionOrganization,
  createOrgAdmin,
} = require("../utils/organizationService");

function saveSessionUser(req, sessionUser, res, status, payload) {
  const previousSid = req.sessionID;

  req.session.regenerate(function (err) {
    if (err) {
      return res.status(500).json({ statusMessage: "Session save failed" });
    }

    req.session.user = sessionUser;
    req.session.save(function (saveErr) {
      if (saveErr) {
        return res.status(500).json({ statusMessage: "Session save failed" });
      }

      Promise.resolve()
        .then(function () {
          if (previousSid && previousSid !== req.sessionID) {
            return forgetSession(previousSid);
          }
        })
        .then(function () {
          return upsertAuthSession(req, { force: true });
        })
        .then(function () {
          res.status(status).json(payload);
        })
        .catch(function (registryErr) {
          console.log(registryErr);
          res.status(status).json(payload);
        });
    });
  });
}

module.exports.registerController = async function (req, res) {
  const {
    username,
    email,
    password,
    organizationName,
    topLevelDepartmentName,
  } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      statusMessage: "username, email, and password are required",
    });
  }

  if (typeof username !== "string" || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof password !== "string" || password.length < 8 ||
      (req.body.confirmPassword !== undefined && password !== req.body.confirmPassword)) {
    return res.status(400).json({ statusMessage: "Use a valid email and matching passwords of at least 8 characters" });
  }

  const orgName = organizationName || `${username}'s organization`;

  try {
    const { organization, adminRole, department } = await provisionOrganization({
      name: orgName,
      topLevelDepartmentName,
      allowSlugCollision: true,
    });

    const employee = await createOrgAdmin({
      organization,
      adminRole,
      department,
      username,
      email,
      password,
    });

    const sessionUser = await buildSessionUser(employee);

    saveSessionUser(req, sessionUser, res, 201, {
      statusMessage: "Registration success",
      data: {
        ...sessionUser,
        organizationSlug: organization.slug,
        organizationName: organization.name,
      },
    });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({
        statusMessage: "Email, username, or organization already exists",
      });
    }
    res.status(400).json({ statusMessage: "Registration failed" });
  }
};

module.exports.loginController = async function (req, res) {
  try {
    const email = (req.body.email || "").toLowerCase().trim();
    const { password, organizationSlug } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        statusMessage: "email and password are required",
      });
    }

    let employee;

    if (organizationSlug) {
      const organization = await Organization.findOne({
        slug: slugify(organizationSlug),
      });
      if (!organization) {
        return res.status(401).json({ statusMessage: "User not found" });
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
          statusMessage: "Specify organizationSlug to choose a tenant",
        });
      }
      employee = matches[0];
    }

    if (!employee) {
      return res.status(401).json({ statusMessage: "User not found" });
    }

    if (employee.mustSetPassword) {
      return res.status(403).json({
        statusMessage:
          "Set your password using the invite code sent to your email",
      });
    }

    const passwordCheckStatus = await bcrypt.compare(
      password,
      employee.password
    );

    if (!passwordCheckStatus) {
      return res.status(401).json({ statusMessage: "Password didn't match" });
    }

    const sessionUser = await buildSessionUser(employee);
    const organization = await Organization.findById(employee.tenantId).lean();

    saveSessionUser(req, sessionUser, res, 200, {
      statusMessage: "Login success",
      data: {
        ...sessionUser,
        organizationSlug: organization?.slug,
        organizationName: organization?.name,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Login failed" });
  }
};

module.exports.logoutController = async function (req, res) {
  const sessionId = req.sessionID;
  req.session.destroy(function (err) {
    if (err) {
      return res.status(500).json({ statusMessage: "Logout failed" });
    }
    forgetSession(sessionId).catch(function (forgetErr) {
      console.log(forgetErr);
    });
    res.status(200).json({ statusMessage: "Logout success" });
  });
};

module.exports.getSessionController = async function (req, res) {
  res.json({ data: req.session.user });
};

