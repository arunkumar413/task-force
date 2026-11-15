const Organization = require("../models/Organization");
const Department = require("../models/Department");
const Employee = require("../models/Employee");

function idString(value) {
  if (!value) {
    return null;
  }
  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }
  return value.toString();
}

function canChangeDepartment(actorId, employee) {
  const employeeId = employee._id.toString();
  if (!actorId || actorId === employeeId) {
    return false;
  }
  const managerId = idString(employee.managerId);
  const ancestors = (employee.ancestorManagers || []).map(idString);
  return managerId === actorId || ancestors.includes(actorId);
}

function serializeEmployee(employee, actorId) {
  return {
    id: employee._id.toString(),
    name: employee.name,
    username: employee.username,
    email: employee.email,
    designation: employee.designation || "",
    phone: employee.phone || "",
    roles: (employee.roleIds || [])
      .map(function (role) {
        return role && role.name ? role.name : null;
      })
      .filter(Boolean),
    departmentId: idString(employee.departmentId),
    departmentName:
      employee.departmentId && employee.departmentId.name
        ? employee.departmentId.name
        : null,
    managerId: idString(employee.managerId),
    canChangeDepartment: canChangeDepartment(actorId, employee),
  };
}

function nestByParent(items, getParentId) {
  const childrenByParent = new Map();

  for (const item of items) {
    const parentId = getParentId(item) || "root";
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }
    childrenByParent.get(parentId).push(item);
  }

  function walk(parentId) {
    return (childrenByParent.get(parentId) || []).map(function (item) {
      return Object.assign({}, item, {
        children: walk(item.id),
      });
    });
  }

  return walk("root");
}

module.exports.getHierarchy = async function (req, res) {
  try {
    const tenantId = req.session.user.tenantId;
    const organization = await Organization.findById(tenantId).lean();

    if (!organization) {
      return res.status(404).json({ statusMessage: "Organization not found" });
    }

    const [departments, employees] = await Promise.all([
      Department.find({ tenantId }).sort({ name: 1 }).lean(),
      Employee.find({ tenantId, isActive: true })
        .select("-password")
        .populate("roleIds", "name")
        .populate("departmentId", "name")
        .sort({ name: 1 })
        .lean(),
    ]);

    const actorId = req.session.user.id;
    const people = employees.map(function (employee) {
      return serializeEmployee(employee, actorId);
    });
    const peopleByDepartment = new Map();

    for (const person of people) {
      const key = person.departmentId || "unassigned";
      if (!peopleByDepartment.has(key)) {
        peopleByDepartment.set(key, []);
      }
      peopleByDepartment.get(key).push(person);
    }

    const departmentNodes = departments.map(function (department) {
      return {
        id: department._id.toString(),
        name: department.name,
        parentId: idString(department.parentId),
        employees: peopleByDepartment.get(department._id.toString()) || [],
      };
    });

    res.json({
      data: {
        organization: {
          id: organization._id.toString(),
          name: organization.name,
          slug: organization.slug,
          plan: organization.plan,
        },
        departments: nestByParent(departmentNodes, function (node) {
          return node.parentId;
        }),
        unassignedEmployees: peopleByDepartment.get("unassigned") || [],
        reporting: nestByParent(people, function (person) {
          return person.managerId;
        }),
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ statusMessage: "Unable to load hierarchy" });
  }
};

