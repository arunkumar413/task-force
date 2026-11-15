const Department = require("../models/Department");

async function departmentOptions(tenantId) {
  const departments = await Department.find({ tenantId }).select("name parentId").lean();
  const byId = new Map(departments.map(item => [String(item._id), item]));
  function path(item, seen = new Set()) {
    const id = String(item._id);
    if (seen.has(id)) throw Object.assign(new Error("Invalid department hierarchy"), { status: 400 });
    seen.add(id);
    const segment = item.name.trim().toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");
    if (!item.parentId) return "/" + segment;
    const parent = byId.get(String(item.parentId));
    if (!parent) throw Object.assign(new Error("Invalid department hierarchy"), { status: 400 });
    return path(parent, seen) + "/" + segment;
  }
  return departments.map(item => ({ id: String(item._id), path: path(item) })).sort((a, b) => a.path.localeCompare(b.path));
}
async function departmentFields(tenantId, departmentId) {
  if (!departmentId) return { departmentId: null, departmentLabel: "" };
  if (typeof departmentId !== "string") throw Object.assign(new Error("Invalid department"), { status: 400 });
  const department = (await departmentOptions(tenantId)).find(item => item.id === departmentId);
  if (!department) throw Object.assign(new Error("Department must belong to your organization"), { status: 400 });
  const departmentLabel = department.path;
  if (departmentLabel.length > 1000) throw Object.assign(new Error("Department path is too long"), { status: 400 });
  return { departmentId, departmentLabel };
}
function withDepartmentLabel(labels, label) {
  if (!Array.isArray(labels) || labels.some(item => typeof item !== "string")) throw Object.assign(new Error("Labels must be a list of strings"), { status: 400 });
  return [...new Set([...labels.map(item => item.trim()).filter(Boolean), ...(label ? [label] : [])])];
}
async function fieldsForLabels(tenantId, labels, defaultDepartmentId) {
  const fields = await departmentFields(tenantId, defaultDepartmentId);
  return { ...fields, labels: withDepartmentLabel(labels === undefined ? [] : labels, fields.departmentLabel) };
}
module.exports = { departmentOptions, departmentFields, withDepartmentLabel, fieldsForLabels };
