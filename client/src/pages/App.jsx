import { Input, Button, priorityClasses } from "../components/FormControls";
import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { isToday, isTomorrow, isThisWeek, isThisMonth, addWeeks, addMonths, isSameWeek, isSameMonth, isBefore, startOfDay } from "date-fns";
import { loadTasks } from "../store/tasksFilterSlice";
export default function App() {
  const {
    viewId
  } = useParams();
  const {
    items,
    views,
    loading,
    error,
    loaded
  } = useSelector(state => state.tasks);
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  function toggleFilter(value, setValues) {
    setValues(values => values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  }
  const view = views.find(item => item.id === viewId);
  const groups = useMemo(() => {
    const buckets = {
      Overdue: [],
      Today: [],
      Tomorrow: [],
      "This week": [],
      "Next week": [],
      "This month": [],
      "Next month": [],
      Later: [],
      "No due date": []
    };
    const now = new Date();
    const searchTerms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    items.filter(task => {
      if (viewId === "mine" && String(task.employee) !== String(auth.id || "1")) return false;
      const searchableFields = [task.title, task.priority, task.status, task.user, task.description].map(value => String(value ?? "").toLowerCase());
      if (!searchTerms.every(term => searchableFields.some(value => value.includes(term)))) return false;
      if (priorities.length && !priorities.includes(task.priority)) return false;
      if (statuses.length && !statuses.includes(task.status)) return false;
      if (view?.priorities?.length && !view.priorities.includes(task.priority)) return false;
      if (view?.statuses?.length && !view.statuses.includes(task.status)) return false;
      if (view?.labels?.length && !view.labels.some(label => task.labels.includes(label))) return false;
      if (view?.employees?.length && !view.employees.includes(String(task.employee))) return false;
      return true;
    }).sort((a, b) => new Date(a.dueDate || 8640000000000000) - new Date(b.dueDate || 8640000000000000)).forEach(task => {
      const date = new Date(task.dueDate);
      const bucket = !task.dueDate || Number.isNaN(+date) ? "No due date" : isBefore(date, startOfDay(now)) ? "Overdue" : isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : isThisWeek(date) ? "This week" : isSameWeek(date, addWeeks(now, 1)) ? "Next week" : isThisMonth(date) ? "This month" : isSameMonth(date, addMonths(now, 1)) ? "Next month" : "Later";
      buckets[bucket].push(task);
    });
    return Object.entries(buckets).filter(([, tasks]) => tasks.length);
  }, [items, search, priorities, statuses, view, viewId, auth.id]);
  if (viewId && viewId !== "mine" && loaded && !view) return <p>View not found. <Link to="/">All tasks</Link></p>;
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 [&_h1]:mb-1"><div><h1 className="mb-5 text-3xl font-semibold tracking-tight text-slate-900">{view?.name || (viewId === "mine" ? "My tasks" : "All tasks")}</h1><p className="text-sm text-slate-500">A clear view of what’s next.</p></div><Link className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" to="/add-new-task">+ New task</Link></div>
    <div className="grid gap-5 md:grid-cols-[minmax(180px,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] md:items-start">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Search<Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks" /></label>
      <fieldset className="m-0 min-w-0 border-0 p-0"><legend className="mb-2.5 text-sm font-medium text-slate-700">Priority</legend><div className="flex flex-wrap gap-2">
        {["Low", "Medium", "High", "Urgent"].map(value => <Button key={value} type="button" className="min-h-9 rounded-full border border-slate-300 bg-surface px-3.5 py-1.5 text-sm leading-relaxed text-slate-700 transition-colors hover:border-primary hover:text-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-white" aria-pressed={priorities.includes(value)} onClick={() => toggleFilter(value, setPriorities)}>{value}</Button>)}
      </div></fieldset>
      <fieldset className="m-0 min-w-0 border-0 p-0"><legend className="mb-2.5 text-sm font-medium text-slate-700">Status</legend><div className="flex flex-wrap gap-2">
        {["Pending", "In progress", "Done", "Backlog", "Cancelled"].map(value => <Button key={value} type="button" className="min-h-9 rounded-full border border-slate-300 bg-surface px-3.5 py-1.5 text-sm leading-relaxed text-slate-700 transition-colors hover:border-primary hover:text-primary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-white" aria-pressed={statuses.includes(value)} onClick={() => toggleFilter(value, setStatuses)}>{value}</Button>)}
      </div></fieldset>
      {(priorities.length > 0 || statuses.length > 0) && <Button className="col-span-full justify-self-start border-0 p-0 text-sm text-primary underline underline-offset-4" type="button" onClick={() => {
        setPriorities([]);
        setStatuses([]);
      }}>Clear filters</Button>}
    </div>
    {loading && <p role="status">Loading tasks…</p>}
    {error && <p role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} <Button onClick={() => dispatch(loadTasks())}>Retry</Button></p>}
    {!loading && !error && !groups.length && <div className="mb-5 rounded-xl border border-slate-200 bg-surface p-6">No tasks match this view.</div>}
    {groups.map(([label, tasks]) => <section key={label} className="mt-7"><h2 className="mb-3.5 text-lg font-semibold tracking-tight text-slate-900">{label} <span className="text-sm text-slate-500">({tasks.length})</span></h2><div className="mb-5 overflow-x-auto rounded-xl border border-slate-200 bg-surface">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="group">
            <th className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-slate-500 uppercase">Task</th>
            <th className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-slate-500 uppercase">Priority</th>
            <th className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-slate-500 uppercase">Status</th>
            <th className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-slate-500 uppercase">Assignee</th>
            <th className="border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-slate-500 uppercase">Due date</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => <tr key={task.id} className="group"><td className="border-b border-slate-200 px-4 py-3 whitespace-nowrap group-last:border-b-0"><Link to={"/task/" + task.id}>{task.title}</Link></td><td className="border-b border-slate-200 px-4 py-3 whitespace-nowrap group-last:border-b-0"><span className={priorityClasses[task.priority]}>{task.priority}</span></td><td className="border-b border-slate-200 px-4 py-3 whitespace-nowrap group-last:border-b-0">{task.status}</td><td className="border-b border-slate-200 px-4 py-3 whitespace-nowrap group-last:border-b-0">{task.user || "—"}</td><td className="border-b border-slate-200 px-4 py-3 whitespace-nowrap group-last:border-b-0">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</td></tr>)}
        </tbody>
      </table>
    </div></section>)}
  </>;
}
