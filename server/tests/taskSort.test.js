const { test } = require("node:test");
const assert = require("node:assert/strict");

test("dates within a group do not override assignee, priority, or status", async () => {
  const { compareTasks } = await import("../../client/src/utils/taskSort.mjs");
  const at = hour => new Date(2026, 10, 23, hour).toISOString();
  const tasks = [
    { id: "bob", user: "Bob", priority: "Urgent", status: "Pending", dueDate: at(1) },
    { id: "alice-low", user: "Alice", priority: "Low", status: "Pending", dueDate: at(2) },
    { id: "alice-high-done", user: "Alice", priority: "High", status: "Done", dueDate: at(3) },
    { id: "alice-high-pending", user: "Alice", priority: "High", status: "Pending", dueDate: at(23) },
    { id: "previous-day", user: "Zoe", priority: "Low", status: "Done", dueDate: new Date(2026, 10, 22, 23).toISOString() },
  ];
  assert.deepEqual(tasks.sort(compareTasks).map(task => task.id), ["alice-high-pending", "alice-high-done", "alice-low", "bob", "previous-day"]);
});

test("group sorting uses assignee, priority, status, date, then ID", async () => {
  const { compareTasks } = await import("../../client/src/utils/taskSort.mjs");
  const base = { dueDate: "2026-11-23", user: "Alice", priority: "High", status: "Pending" };
  const source = [
    { ...base, id: "later", dueDate: "2026-11-24", priority: "Urgent" },
    { ...base, id: "bob", user: "Bob", priority: "Urgent" },
    { ...base, id: "low", priority: "Low" },
    { ...base, id: "done", status: "Done" },
    { ...base, id: "b" },
    { ...base, id: "a", user: "alice" },
    { ...base, id: "urgent", priority: "Urgent" },
    { ...base, id: "backlog", status: "Backlog" },
    { ...base, id: "missing", dueDate: null },
    { ...base, id: "invalid", dueDate: "invalid" },
  ];
  const original = source.map(task => task.id);
  assert.deepEqual([...source].sort(compareTasks).map(task => task.id), ["urgent", "later", "backlog", "a", "b", "invalid", "missing", "done", "low", "bob"]);
  assert.deepEqual(source.map(task => task.id), original);
  assert.equal(compareTasks(source[0], source[0]), 0);
  const undated = ["Low", "Medium", "High", "Urgent"].map(priority => ({ ...base, dueDate: null, priority }));
  assert.deepEqual(undated.sort(compareTasks).map(task => task.priority), ["Urgent", "High", "Medium", "Low"]);
});
