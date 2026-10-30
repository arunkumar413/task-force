import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { saveView } from "../store/tasksFilterSlice";
import { API_URL } from "../constants";
export function CreateViewPage() {
  const [name, setName] = useState("");
  const [priorities, setPriorities] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [labels, setLabels] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const auth = useSelector(state => state.auth);
  useEffect(() => {
    if (!auth.isLoggedin) { setEmployees([1,2,3].map(id => ({ id: String(id), name: "Demo user " + id }))); return; }
    const controller = new AbortController();
    fetch(API_URL + "/employees", { credentials: "include", signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error("Unable to load employees"); setEmployees(await response.json()); })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, [auth.isLoggedin]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toggle = (value, values, set) => set(values.includes(value) ? values.filter(item => item !== value) : [...values,value]);
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try { const view = await dispatch(saveView({ name, priorities, statuses, labels: labels.split(",").map(value => value.trim()).filter(Boolean), employees: selectedEmployees })).unwrap(); navigate("/view/" + view.id); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <><h1>Create view</h1><form className="task-card task-form" onSubmit={submit}>
    {error && <p role="alert">{error}</p>}
    <label>View name<input required maxLength={100} value={name} onChange={e => setName(e.target.value)} /></label>
    <fieldset><legend>Priority (leave empty for all)</legend><div className="actions">{["Low","Medium","High","Urgent"].map(value => <label className="check-label" key={value}><input type="checkbox" checked={priorities.includes(value)} onChange={() => toggle(value,priorities,setPriorities)} />{value}</label>)}</div></fieldset>
    <fieldset><legend>Status (leave empty for all)</legend><div className="actions">{["Pending","In progress","Done","Backlog","Cancelled"].map(value => <label className="check-label" key={value}><input type="checkbox" checked={statuses.includes(value)} onChange={() => toggle(value,statuses,setStatuses)} />{value}</label>)}</div></fieldset>
    <fieldset><legend>Assignees (leave empty for all)</legend><div className="actions">{employees.map(employee => {
      const id = String(employee.id || employee._id);
      return <label className="check-label" key={id}><input type="checkbox" checked={selectedEmployees.includes(id)} onChange={() => toggle(id,selectedEmployees,setSelectedEmployees)} />{employee.name}</label>;
    })}</div></fieldset>
    <label>Labels (comma separated)<input value={labels} onChange={e => setLabels(e.target.value)} /></label><button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save view"}</button>
  </form></>;
}
