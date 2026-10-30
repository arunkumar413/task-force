import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { isToday, isTomorrow, isThisWeek, isThisMonth, addWeeks, addMonths, isSameWeek, isSameMonth, isBefore, startOfDay } from "date-fns";
import { loadTasks } from "../store/tasksFilterSlice";
export default function App() {
  const { viewId } = useParams();
  const { items, views, loading, error, loaded } = useSelector(state => state.tasks);
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const view = views.find(item => item.id === viewId);
  const groups = useMemo(() => {
    const buckets = { Overdue: [], Today: [], Tomorrow: [], "This week": [], "Next week": [], "This month": [], "Next month": [], Later: [], "No due date": [] };
    const now = new Date();
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    items.filter(task => {
      if (viewId === "mine" && String(task.employee) !== String(auth.id || "1")) return false;
      const searchableFields = [task.title, task.priority, task.status, task.user, task.description]
        .map(value => String(value ?? "").toLowerCase());
      if (!searchTerms.every(term => searchableFields.some(value => value.includes(term)))) return false;
      if (priority && task.priority !== priority || status && task.status !== status) return false;
      if (view?.priorities?.length && !view.priorities.includes(task.priority)) return false;
      if (view?.statuses?.length && !view.statuses.includes(task.status)) return false;
      if (view?.labels?.length && !view.labels.some(label => task.labels.includes(label))) return false;
      if (view?.employees?.length && !view.employees.includes(String(task.employee))) return false;
      return true;
    }).sort((a,b) => new Date(a.dueDate || 8640000000000000) - new Date(b.dueDate || 8640000000000000)).forEach(task => {
      const date = new Date(task.dueDate);
      const bucket = !task.dueDate || Number.isNaN(+date) ? "No due date"
        : isBefore(date, startOfDay(now)) ? "Overdue" : isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow"
        : isThisWeek(date) ? "This week" : isSameWeek(date, addWeeks(now, 1)) ? "Next week"
        : isThisMonth(date) ? "This month" : isSameMonth(date, addMonths(now, 1)) ? "Next month" : "Later";
      buckets[bucket].push(task);
    });
    return Object.entries(buckets).filter(([, tasks]) => tasks.length);
  }, [items, search, priority, status, view, viewId, auth.id]);
  if (viewId && viewId !== "mine" && loaded && !view) return <p>View not found. <Link to="/">All tasks</Link></p>;
  return <>
    <div className="page-heading"><div><h1>{view?.name || (viewId === "mine" ? "My tasks" : "All tasks")}</h1><p className="muted">A clear view of what’s next.</p></div><Link className="primary-button" to="/add-new-task">+ New task</Link></div>
    <div className="task-filters">
      <label>Search<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks" /></label>
      <label>Priority<select value={priority} onChange={e => setPriority(e.target.value)}><option value="">All priorities</option>{["Low","Medium","High","Urgent"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["Pending","In progress","Done","Backlog","Cancelled"].map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    {loading && <p role="status">Loading tasks…</p>}
    {error && <p role="alert">{error} <button onClick={() => dispatch(loadTasks())}>Retry</button></p>}
    {!loading && !error && !groups.length && <div className="task-card">No tasks match this view.</div>}
    {groups.map(([label,tasks]) => <section key={label} className="task-group"><h2>{label} <span className="muted">({tasks.length})</span></h2><div className="task-card table-scroll">
      <table><thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Assignee</th><th>Due date</th></tr></thead><tbody>
        {tasks.map(task => <tr key={task.id}><td><Link to={"/task/" + task.id}>{task.title}</Link></td><td><span className={"priority priority-" + task.priority.toLowerCase()}>{task.priority}</span></td><td>{task.status}</td><td>{task.user || "—"}</td><td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</td></tr>)}
      </tbody></table></div></section>)}
  </>;
}
