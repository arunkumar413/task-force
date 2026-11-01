import { Input, Select, Button } from "./FormControls";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { saveTask } from "../store/tasksFilterSlice";
import { AssigneeSelect } from "./AssigneeSelect";
import { MarkdownEditor } from "./MarkdownEditor";
export function TaskForm({
  task
}) {
  const auth = useSelector(state => state.auth);
  const [form, setForm] = useState(() => ({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "Medium",
    status: task?.status || "Backlog",
    dueDate: task?.dueDate?.slice(0, 10) || "",
    employee: task?.employee || auth.id || "1",
    labels: task?.labels?.join(", ") || ""
  }));
  const [assignee, setAssignee] = useState(() => ({ id: String(task?.employee || auth.id || "1"), name: task?.user || auth.name || auth.username || "Demo user 1" }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  function change(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await dispatch(saveTask({
        ...form,
        ...(task?.id ? {
          id: task.id
        } : {}),
        dueDate: form.dueDate || null,
        labels: form.labels.split(",").map(item => item.trim()).filter(Boolean),
        user: assignee.name
      })).unwrap();
      navigate("/task/" + result.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  return <form className="mb-5 rounded-xl border border-slate-200 bg-surface p-6 grid gap-5" onSubmit={submit}>
    {error && <p role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Title<Input name="title" required maxLength={300} value={form.title} onChange={change} /></label>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Priority<Select aria-label="Priority" name="priority" value={form.priority} onChange={change}>{["Low", "Medium", "High", "Urgent"].map(value => <option key={value}>{value}</option>)}</Select></label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Status<Select aria-label="Status" name="status" value={form.status} onChange={change}>{["Pending", "In progress", "Done", "Backlog", "Cancelled"].map(value => <option key={value}>{value}</option>)}</Select></label>
      <AssigneeSelect selected={assignee} authenticated={auth.isLoggedin} onChange={employee => {
        setAssignee(employee);
        setForm(current => ({ ...current, employee: employee.id }));
      }} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Due date<Input type="date" name="dueDate" value={form.dueDate} onChange={change} /></label>
    </div>
    <MarkdownEditor value={form.description} onChange={change} />
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Labels (comma separated)<Input name="labels" value={form.labels} onChange={change} placeholder="Frontend, Testing" /></label>
    <div className="flex flex-wrap items-center gap-3"><Button className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={saving}>{saving ? "Saving…" : task ? "Update task" : "Create task"}</Button><Button type="button" onClick={() => navigate(-1)}>Cancel</Button></div>
  </form>;
}
