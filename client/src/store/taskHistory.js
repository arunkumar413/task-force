const fields = ["title", "description", "priority", "status", "dueDate", "employee", "labels", "subtasks", "attachments"];
function snapshot(task) {
  return Object.fromEntries(fields.map(field => [field,
    field === "employee" ? { id: task.employee || null, name: task.user || "Demo user" } :
    field === "attachments" ? (task.attachments || []).map(item => ({ file_name: item.file_name, link: item.link })) :
    field === "subtasks" ? (task.subtasks || []).map(item => ({ title: item.title, isDone: item.isDone })) : task[field] ?? null,
  ]));
}
export function demoHistoryEvent(action, changes = []) {
  return { id: crypto.randomUUID(), actorName: "Demo user", action, occurredAt: new Date().toISOString(), changes };
}
export function demoChanges(before, after) {
  const old = snapshot(before), updated = snapshot(after);
  return fields.filter(field => JSON.stringify(old[field]) !== JSON.stringify(updated[field])).map(field => ({ field, before: old[field], after: updated[field] }));
}
