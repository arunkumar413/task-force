import React from "react";
const names = { title: "Title", description: "Description", priority: "Priority", status: "Status", dueDate: "Due date", employee: "Assignee", labels: "Labels", subtasks: "Subtasks", attachments: "Attachments", comment: "Comment" };
function describe(value, field) {
  if (value == null || value === "") return "None";
  if (field === "employee") return value.name || value.id || "Unassigned";
  if (field === "dueDate") return new Date(value).toLocaleDateString();
  if (Array.isArray(value)) return value.length ? value.map(item => typeof item === "string" ? item : item.title ? `${item.isDone ? "Completed" : "Open"}: ${item.title}` : `${item.file_name}${item.link ? " · " + item.link : ""}`).join("\n") : "None";
  return String(value);
}
export function TaskHistory({ history = [] }) {
  const events = [...history].reverse();
  return <section className="mb-5 rounded-xl border border-slate-200 bg-surface p-6">
    <h2 className="mb-4 text-lg font-semibold text-slate-900">Task history</h2>
    <p className="mb-4 text-sm text-slate-500">Changes are recorded from when history tracking was enabled.</p>
    {!events.length ? <p className="text-sm text-slate-500">No changes recorded yet.</p> : <ol className="space-y-5">
      {events.map((entry, index) => <li key={entry._id || entry.id || index} className="border-l-2 border-slate-200 pl-4">
        <p className="text-sm font-medium text-slate-900">{entry.actorName || "Unknown user"} · {entry.action === "created" ? "Created task" : entry.action === "commented" ? "Added comment" : "Updated task"}</p>
        <time className="text-xs text-slate-500" dateTime={entry.occurredAt}>{new Date(entry.occurredAt).toLocaleString()}</time>
        <dl className="mt-3 space-y-3">{entry.changes.map((change, changeIndex) => <div key={changeIndex}>
          <dt className="mb-1 text-sm font-medium text-slate-700">{names[change.field] || change.field}</dt>
          <dd className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="min-w-0 rounded-lg bg-slate-100 p-3"><span className="mb-1 block text-xs text-slate-500">Before</span><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-sans">{describe(change.before, change.field)}</pre></div>
            <div className="min-w-0 rounded-lg border border-slate-200 p-3"><span className="mb-1 block text-xs text-slate-500">After</span><pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words font-sans">{describe(change.after, change.field)}</pre></div>
          </dd>
        </div>)}</dl>
      </li>)}
    </ol>}
  </section>;
}
