const OrganizationLabels = require("../models/OrganizationLabels");
const Todo = require("../models/Todo");

async function rememberLabels(tenantId, labels) {
  if (!labels.length) return;
  const update = { $addToSet: { labels: { $each: labels } } };
  try {
    await OrganizationLabels.updateOne({ tenantId }, update, { upsert: true, runValidators: true });
  } catch (error) {
    // Concurrent first tasks can race to create the tenant's label document.
    if (error.code !== 11000) throw error;
    await OrganizationLabels.updateOne({ tenantId }, update, { runValidators: true });
  }
}

async function listLabels(tenantId) {
  const [stored, existing] = await Promise.all([
    OrganizationLabels.findOne({ tenantId }).lean(),
    Todo.distinct("labels", { tenantId }),
  ]);
  // Also suggest labels from tasks that predate the collection.
  return [...new Set([...(stored?.labels || []), ...existing].map(label => label.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

module.exports = { rememberLabels, listLabels };
