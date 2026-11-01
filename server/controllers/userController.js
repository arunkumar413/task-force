const Employee = require("../models/Employee");
const Department = require("../models/Department");

module.exports.getTaskAssignees = async function (req, res, next) {
  try {
    const query = String(req.query.q || "").trim().slice(0, 100);
    const filter = { tenantId: req.session.user.tenantId, isActive: true };
    if (query) {
      const pattern = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: pattern }, { email: pattern }, { username: pattern }];
    }
    const employees = await Employee.find(filter)
      .select("name username email").sort({ name: 1, _id: 1 }).limit(30);
    res.json({ data: employees });
  } catch (err) { next(err); }
};

function idString(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }
  return value.toString();
}

function isManagerOf(actorId, employee) {
  if (!actorId || !employee) {
    return false;
  }
  if (idString(employee._id) === actorId) {
    return false;
  }
  const managerId = idString(employee.managerId);
  const ancestors = (employee.ancestorManagers || []).map(idString);
  return managerId === actorId || ancestors.includes(actorId);
}

module.exports.getEmployees = async function (req, res) {
  try {
    const employees = await Employee.find({
      tenantId: req.session.user.tenantId,
    }).select("-password");
    res.json(employees);
  } catch (e) {
    console.log(e);
    res.status(500).json({ statusMessage: "Unable to fetch employees" });
  }
};

module.exports.updateEmployeeDepartment = async function (req, res) {
  try {
    const actorId = req.session.user.id;
    const tenantId = req.session.user.tenantId;
    const targetId = req.params.id;
    const departmentId =
      req.body.departmentId === "" || req.body.departmentId == null
        ? null
        : req.body.departmentId;

    if (targetId === actorId) {
      return res.status(403).json({
        statusMessage: "Only your manager can change your department",
      });
    }

    const employee = await Employee.findOne({
      _id: targetId,
      tenantId,
      isActive: true,
    });

    if (!employee) {
      return res.status(404).json({ statusMessage: "Employee not found" });
    }

    if (!isManagerOf(actorId, employee)) {
      return res.status(403).json({
        statusMessage: "Only this employee's manager can change their department",
      });
    }

    if (departmentId) {
      const department = await Department.findOne({
        _id: departmentId,
        tenantId,
      });
      if (!department) {
        return res.status(400).json({ statusMessage: "Department not found" });
      }
    }

    employee.departmentId = departmentId;
    await employee.save();
    await employee.populate("departmentId", "name");

    res.json({
      statusMessage: "Department updated",
      data: {
        id: employee._id.toString(),
        departmentId: idString(employee.departmentId),
        departmentName:
          employee.departmentId && employee.departmentId.name
            ? employee.departmentId.name
            : null,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to update department" });
  }
};

