import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { saveTask } from "../store/tasksFilterSlice";
import { API_URL } from "../constants";
import { MarkdownEditor } from "./MarkdownEditor";
export function TaskForm({ task }) {
  const auth = useSelector(state => state.auth);
  const [form, setForm] = useState(() => ({
    title: task?.title || "", description: task?.description || "", priority: task?.priority || "Medium",
    status: task?.status || "Backlog", dueDate: task?.dueDate?.slice(0,10) || "",
    employee: task?.employee || auth.id || "1", labels: task?.labels?.join(", ") || "",
  }));
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.isLoggedin) return;
    const controller = new AbortController();
    fetch(API_URL + "/employees", { credentials: "include", signal: controller.signal })
      .then(async res => { if (!res.ok) throw new Error("Unable to load employees"); const data = await res.json(); setEmployees(data); })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, [auth.isLoggedin]);
  function change(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const employee = employees.find(item => String(item.id || item._id) === form.employee);
      const result = await dispatch(saveTask({ ...form, ...(task?.id ? { id: task.id } : {}), dueDate: form.dueDate || null,
        labels: form.labels.split(",").map(item => item.trim()).filter(Boolean),
        user: employee?.name || task?.user || "Demo user " + form.employee,
      })).unwrap();
      navigate("/task/" + result.id);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  const options = auth.isLoggedin ? employees.filter(employee => auth.fullAccess || String(employee.id || employee._id) === auth.id || (employee.ancestorManagers || []).includes(auth.id)) :
    [1,2,3].map(id => ({ id: String(id), name: "Demo user " + id }));
  return <form className="task-card task-form" onSubmit={submit}>
    {error && <p role="alert">{error}</p>}
    <label>Title<input name="title" required maxLength={300} value={form.title} onChange={change} /></label>
    <div className="form-grid">
      <label>Priority<select aria-label="Priority" name="priority" value={form.priority} onChange={change}>{["Low","Medium","High","Urgent"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Status<select aria-label="Status" name="status" value={form.status} onChange={change}>{["Pending","In progress","Done","Backlog","Cancelled"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Assignee<select aria-label="Assignee" name="employee" value={form.employee} onChange={change}>
        {!options.some(item => String(item.id || item._id) === form.employee) && <option value={form.employee}>{task?.user || auth.username}</option>}
        {options.map(item => <option value={item.id || item._id} key={item.id || item._id}>{item.name}</option>)}
      </select></label>
      <label>Due date<input type="date" name="dueDate" value={form.dueDate} onChange={change} /></label>
    </div>
    <MarkdownEditor value={form.description} onChange={change} />
    <label>Labels (comma separated)<input name="labels" value={form.labels} onChange={change} placeholder="Frontend, Testing" /></label>
    <div className="actions"><button className="primary-button" disabled={saving}>{saving ? "Saving…" : task ? "Update task" : "Create task"}</button><button type="button" onClick={() => navigate(-1)}>Cancel</button></div>
  </form>;
}
