const priorityRanks = new Map(["Urgent", "High", "Medium", "Low"].map((value, index) => [value, index]));
const statusRanks = new Map(["Backlog", "Pending", "In progress", "Done", "Cancelled"].map((value, index) => [value, index]));
const names = new Intl.Collator(undefined, { sensitivity: "base", numeric: true });

function dueDay(value) {
  const date = value ? new Date(value) : new Date(NaN);
  if (!Number.isFinite(date.getTime())) return Infinity;
  // Match the local calendar date displayed by the table, ignoring hidden times.
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

// Compare tasks within a date group. The page determines group order first.
export function compareTasks(a, b) {
  const firstDate = dueDay(a.dueDate);
  const secondDate = dueDay(b.dueDate);
  return names.compare(String(a.user || "").trim(), String(b.user || "").trim())
    || (priorityRanks.get(a.priority) ?? priorityRanks.size) - (priorityRanks.get(b.priority) ?? priorityRanks.size)
    || (statusRanks.get(a.status) ?? statusRanks.size) - (statusRanks.get(b.status) ?? statusRanks.size)
    || (firstDate === secondDate ? 0 : firstDate < secondDate ? -1 : 1)
    || String(a.id ?? a._id ?? "").localeCompare(String(b.id ?? b._id ?? ""));
}
