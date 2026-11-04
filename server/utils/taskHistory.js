const Employee = require("../models/Employee");
const fields = ["title", "description", "priority", "status", "dueDate", "employee", "labels", "subtasks", "attachments"];
async function snapshot(task) {
  const employee = task.employee ? await Employee.findOne({ _id: task.employee, tenantId: task.tenantId }).select("name").lean() : null;
  return {
    title: task.title, description: task.description || "", priority: task.priority, status: task.status,
    dueDate: task.dueDate?.toISOString() || null,
    employee: { id: task.employee ? String(task.employee) : null, name: employee?.name || "Unassigned" },
    labels: [...task.labels],
    subtasks: task.subtasks.map(item => ({ title: item.title, isDone: item.isDone })),
    attachments: task.attachments.map(item => ({ file_name: item.file_name, link: item.link })),
  };
}
function event(user, action, changes = []) {
  return { actor: user.id, actorName: user.name || user.username, action, occurredAt: new Date(), changes };
}
function changes(before, after) {
  return fields.filter(field => JSON.stringify(before[field]) !== JSON.stringify(after[field]))
    .map(field => ({ field, before: before[field], after: after[field] }));
}
module.exports = { snapshot, event, changes };
