import { Input, Button } from "../components/FormControls";
import { MultiAssigneeSelect } from "../components/MultiAssigneeSelect";
import { LabelsInput } from "../components/LabelsInput";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { saveView } from "../store/tasksFilterSlice";
import { API_URL, buttonStyles } from "../constants";
export function CreateViewPage() {
  const { viewId } = useParams();
  const { views, loaded, error } = useSelector(state => state.tasks);
  const view = views.find(item => item.id === viewId);
  if (viewId && !loaded) return <p role="status">{error || "Loading view…"}</p>;
  if (viewId && !view) return <p>View not found. <Link to="/">All tasks</Link></p>;
  return <ViewForm key={viewId || "new"} view={view} />;
}
function ViewForm({ view }) {
  const tasks = useSelector(state => state.tasks.items);
  const [name, setName] = useState(view?.name || "");
  const [priorities, setPriorities] = useState(view?.priorities || []);
  const [statuses, setStatuses] = useState(view?.statuses || []);
  const [labels, setLabels] = useState(view?.labels || []);
  const [organizationLabels, setOrganizationLabels] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(() => (view?.employees || []).map(id => ({ id: String(id), name: tasks.find(task => String(task.employee) === String(id))?.user || String(id) })));
  const auth = useSelector(state => state.auth);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoggedin) return;
    const controller = new AbortController();
    setOrganizationLabels([]);
    fetch(API_URL + "/tasks/labels", { credentials: "include", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Unable to load organization labels");
      const { data } = await response.json();
      setOrganizationLabels(data);
    }).catch(err => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, [auth.isLoggedin, auth.id]);
  const toggle = (value, values, set) => set(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await dispatch(saveView({
        ...(view?.id ? { id: view.id } : {}),
        name,
        priorities,
        statuses,
        labels,
        employees: selectedEmployees.map(employee => String(employee.id || employee._id))
      })).unwrap();
      navigate("/view/" + result.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return <><h1 className="mb-5 text-3xl font-semibold tracking-tight text-slate-900">{view ? "Edit view" : "Create view"}</h1><form className="mb-5 rounded-xl border border-slate-200 bg-surface p-6 grid gap-5" onSubmit={submit}>
    {error && <p role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">View name<Input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
    <fieldset className="min-w-0 border-0 p-0"><legend className="mb-2.5 text-sm font-medium text-slate-700">Priority (leave empty for all)</legend><div className="flex flex-wrap items-center gap-3">{["Low", "Medium", "High", "Urgent"].map(value => <label className="inline-flex min-h-9 cursor-pointer items-center gap-2.5 px-1 py-1.5 text-sm font-medium leading-normal pointer-coarse:min-h-11" key={value}><Input type="checkbox" checked={priorities.includes(value)} onChange={() => toggle(value, priorities, setPriorities)} />{value}</label>)}</div></fieldset>
    <fieldset className="min-w-0 border-0 p-0"><legend className="mb-2.5 text-sm font-medium text-slate-700">Status (leave empty for all)</legend><div className="flex flex-wrap items-center gap-3">{["Pending", "In progress", "Done", "Backlog", "Cancelled"].map(value => <label className="inline-flex min-h-9 cursor-pointer items-center gap-2.5 px-1 py-1.5 text-sm font-medium leading-normal pointer-coarse:min-h-11" key={value}><Input type="checkbox" checked={statuses.includes(value)} onChange={() => toggle(value, statuses, setStatuses)} />{value}</label>)}</div></fieldset>
    <MultiAssigneeSelect selected={selectedEmployees} onChange={setSelectedEmployees} authenticated={auth.isLoggedin} />
    <div className="space-y-2">
      <LabelsInput value={labels} onChange={setLabels} suggestions={auth.isLoggedin ? organizationLabels : tasks.flatMap(task => task.labels || [])} />
      <p className="text-xs text-slate-500">Leave labels empty to include all labels.</p>
    </div>
    <div className="flex flex-wrap items-center gap-3"><Button className={buttonStyles.primary.join(" ")} disabled={saving}>{saving ? "Saving…" : "Save view"}</Button><Button type="button" disabled={saving} onClick={() => navigate(view ? "/view/" + view.id : "/")}>Cancel</Button></div>
  </form></>;
}
