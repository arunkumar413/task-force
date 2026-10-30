const mongoose = require("mongoose");
const { connectDB } = require("../DBConfig");
const Organization = require("../models/Organization");
const Role = require("../models/Role");
const Resource = require("../models/Resource");
const Permission = require("../models/Permission");

// Repair the old demo seed without replacing tasks, users, or other grants.
async function repairDemoTaskPermissions() {
  const organization = await Organization.findOne({ slug: "acme" });
  if (!organization) throw new Error("The acme demo organization was not found");
  const [role, resource] = await Promise.all([
    Role.findOne({ tenantId: organization._id, name: "Employee" }),
    Resource.findOne({ key: "task" }),
  ]);
  if (!role || !resource) throw new Error("The demo Employee role or task resource was not found");
  return Permission.updateOne(
    { tenantId: organization._id, role: role._id, resource: resource._id, read: true, write: true, update: false },
    { $set: { update: true } }
  );
}

if (require.main === module) {
  connectDB()
    .then(repairDemoTaskPermissions)
    .then(result => console.log(`Updated ${result.modifiedCount} demo Employee task permission grant(s).`))
    .catch(err => { console.error(err.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
}
module.exports = { repairDemoTaskPermissions };
