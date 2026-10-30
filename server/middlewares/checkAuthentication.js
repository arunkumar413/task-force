const Employee = require("../models/Employee");
const { buildSessionUser } = require("../utils/authSession");
const { touchAuthSession } = require("../utils/sessionRegistry");
module.exports.checkAuthentication = async function (req, res, next) {
  if (!req.session.user?.id) return res.status(401).json({ statusMessage: "Session not found" });
  try {
    const employee = await Employee.findOne({ _id: req.session.user.id, tenantId: req.session.user.tenantId, isActive: true });
    if (!employee) {
      req.session.destroy(() => {});
      return res.status(401).json({ statusMessage: "Account is no longer active" });
    }
    // Refresh roles so revocations affect existing device sessions immediately.
    req.session.user = await buildSessionUser(employee);
    touchAuthSession(req);
    next();
  } catch (err) { next(err); }
};
