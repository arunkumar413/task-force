const Employee = require("../models/Employee");

module.exports.dynamicQueryParams = async function (req, res) {
  try {
    const queryParams = req.query;
    const allowedFilters = ["username", "email"];
    const filters = { tenantId: req.session.user.tenantId };

    for (const param in queryParams) {
      if (
        Object.hasOwnProperty.call(queryParams, param) &&
        allowedFilters.includes(param)
      ) {
        filters[param] = queryParams[param];
      }
    }

    const employees = await Employee.find(filters).select("-password");
    res.json(employees);
  } catch (error) {
    console.error("Error executing employee query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

