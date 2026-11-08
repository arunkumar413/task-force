import { Input, Button } from "../components/FormControls";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { saveView } from "../store/tasksFilterSlice";
import { API_URL, buttonStyles } from "../constants";
export function CreateViewPage() {
  const [name, setName] = useState("");
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [labels, setLabels] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const auth = useSelector(state => state.auth);
  useEffect(() => {
    if (!auth.isLoggedin) {
      setEmployees([1, 2, 3].map(id => ({
        id: String(id),
        name: "Demo user " + id
      })));
      return;
    }
    const controller = new AbortController();
    fetch(API_URL + "/employees", {
      credentials: "include",
      signal: controller.signal
    }).then(async response => {
      if (!response.ok) throw new Error("Unable to load employees");
      setEmployees(await response.json());
    }).catch(err => {
      if (err.name !== "AbortError") setError(err.message);
    });
    return () => controller.abort();
  }, [auth.isLoggedin]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toggle = (value, values, set) => set(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const view = await dispatch(saveView({
        name,
        priorities,
        statuses,
        labels: labels.split(",").map(value => value.trim()).filter(Boolean),
        employees: selectedEmployees
      })).unwrap();
      navigate("/view/" + view.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return <><h1 className="mb-5 text-3xl font-semibold tracking-tight text-slate-900">Create view</h1><form className="mb-5 rounded-xl border border-slate-200 bg-surface p-6 grid gap-5" onSubmit={submit}>
    {error && <p role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">View name<Input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
    <fieldset className="min-w-0 border-0 p-0"><legend className="mb-2.5 text-sm font-medium text-slate-700">Priority (leave empty for all)</legend><div className="flex flex-wrap items-center gap-3">{["Low", "Medium", "High", "Urgent"].map(value => <label className="inline-flex min-h-9 cursor-pointer items-center gap-2.5 px-1 py-1.5 text-sm font-medium leading-normal pointer-coarse:min-h-11" key={value}><Input type="checkbox" checked={priorities.includes(value)} onChange={() => toggle(value, priorities, setPriorities)} />{value}</label>)}</div></fieldset>
    <fieldset className="min-w-0 border-0 p-0"><legend className="mb-2.5 text-sm font-medium text-slate-700">Status (leave empty for all)</legend><div className="flex flex-wrap items-center gap-3">{["Pending", "In progress", "Done", "Backlog", "Cancelled"].map(value => <label className="inline-flex min-h-9 cursor-pointer items-center gap-2.5 px-1 py-1.5 text-sm font-medium leading-normal pointer-coarse:min-h-11" key={value}><Input type="checkbox" checked={statuses.includes(value)} onChange={() => toggle(value, statuses, setStatuses)} />{value}</label>)}</div></fieldset>
    <fieldset className="min-w-0 border-0 p-0"><legend className="mb-2.5 text-sm font-medium text-slate-700">Assignees (leave empty for all)</legend><div className="flex flex-wrap items-center gap-3">{employees.map(employee => {
            const id = String(employee.id || employee._id);
            return <label className="inline-flex min-h-9 cursor-pointer items-center gap-2.5 px-1 py-1.5 text-sm font-medium leading-normal pointer-coarse:min-h-11" key={id}><Input type="checkbox" checked={selectedEmployees.includes(id)} onChange={() => toggle(id, selectedEmployees, setSelectedEmployees)} />{employee.name}</label>;
          })}</div></fieldset>
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Labels (comma separated)<Input value={labels} onChange={e => setLabels(e.target.value)} /></label><Button className={buttonStyles.primary.join(" ")} disabled={saving}>{saving ? "Saving…" : "Save view"}</Button>
  </form></>;
}
