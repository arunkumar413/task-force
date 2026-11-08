import { Input, Select, Button } from "./FormControls";
import React, { useEffect, useState } from "react";
import { API_URL, buttonStyles } from "../constants";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { saveTask } from "../store/tasksFilterSlice";
import { AssigneeSelect } from "./AssigneeSelect";
import { MarkdownEditor } from "./MarkdownEditor";
import { LabelsInput } from "./LabelsInput";
import { AttachmentPicker } from "./AttachmentPicker";
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
    labels: [...new Set([...(task?.labels || []), ...(task?.departmentLabel ? [task.departmentLabel] : [])])]
  }));
  const [assignee, setAssignee] = useState(() => ({ id: String(task?.employee || auth.id || "1"), name: task?.user || auth.name || auth.username || "Demo user 1" }));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [lockedLabel, setLockedLabel] = useState(task?.departmentLabel || "");
  const [loadingDepartments, setLoadingDepartments] = useState(auth.isLoggedin);
  useEffect(() => {
    if (!auth.isLoggedin) return;
    const controller = new AbortController();
    fetch(API_URL + "/tasks/departments", { credentials: "include", signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("Unable to load departments");
      const { data: options, defaultLabel } = await response.json();
      setDepartments(options);
      if (!task && defaultLabel) {
        setLockedLabel(defaultLabel);
        setForm(current => ({ ...current, labels: [...new Set([defaultLabel, ...current.labels])] }));
      }
    }).catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingDepartments(false); });
    return () => controller.abort();
  }, [auth.isLoggedin]);
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
        files,
        ...(task?.id ? {
          id: task.id
        } : {}),
        dueDate: form.dueDate || null,
        labels: form.labels,
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
    <LabelsInput value={form.labels} lockedLabel={lockedLabel} onChange={labels => setForm(current => ({ ...current, labels }))} suggestions={departments.map(item => item.path)} disabled={loadingDepartments} />
    {!task && (auth.isLoggedin ? <AttachmentPicker files={files} onChange={setFiles} onError={setError} disabled={saving} label="Task attachments" /> : <p className="text-xs text-slate-500">Sign in to upload task attachments.</p>)}
    <div className="flex flex-wrap items-center gap-3"><Button className={buttonStyles.primary.join(" ")} disabled={saving || loadingDepartments}>{saving ? "Saving…" : task ? "Update task" : "Create task"}</Button><Button type="button" onClick={() => navigate(-1)}>Cancel</Button></div>
  </form>;
}
