import React, { useState } from "react";
import Markdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteTask, postComment, saveTask } from "../store/tasksFilterSlice";
export function TaskPage() {
  const { task_id } = useParams();
  const { items, loaded, error: loadError } = useSelector(state => state.tasks);
  const task = items.find(item => item.id === task_id);
  const [comment, setComment] = useState("");
  const [subtask, setSubtask] = useState("");
  const [attachment, setAttachment] = useState({ file_name: "", link: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  async function run(action, after) {
    setBusy(true); setError("");
    try { await dispatch(action).unwrap(); after?.(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  if (!loaded) return <p>{loadError || "Loading task…"}</p>;
  if (!task) return <p>Task not found. <Link to="/">Back to tasks</Link></p>;
  const update = patch => run(saveTask({ id: task.id, ...patch }));
  return <>
    <div className="page-heading"><div><Link to="/">← Tasks</Link><h1>{task.title}</h1></div><div className="actions"><Link className="primary-button" to={"/task/" + task.id + "/edit"}>Edit task</Link><button onClick={() => setDeleting(true)}>Delete</button></div></div>
    {error && <p role="alert">{error}</p>}
    {deleting && <div className="task-card"><p>Delete this task and its comments?</p><div className="actions"><button disabled={busy} onClick={() => run(deleteTask(task.id), () => navigate("/"))}>Delete task</button><button onClick={() => setDeleting(false)}>Keep task</button></div></div>}
    <div className="task-card">
      <dl className="task-meta"><div><dt>Priority</dt><dd>{task.priority}</dd></div><div><dt>Status</dt><dd>{task.status}</dd></div><div><dt>Assignee</dt><dd>{task.user || "—"}</dd></div><div><dt>Due date</dt><dd>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</dd></div></dl>
      <div className="markdown"><Markdown>{task.description || "No description yet."}</Markdown></div>
      <div className="actions">{task.labels?.map(label => <span className="label-chip" key={label}>{label}</span>)}</div>
    </div>
    <section className="task-card"><h2>Subtasks ({task.subtasks.length})</h2>
      {task.subtasks.map((item,index) => <div className="subtask-row" key={item._id || item.id || index}>
        {editingSubtask?.index === index ? <form className="inline-form" onSubmit={event => {
          event.preventDefault();
          run(saveTask({ id: task.id, subtasks: task.subtasks.map((sub,i) => i === index ? { ...sub, title: editingSubtask.title.trim() } : sub) }), () => setEditingSubtask(null));
        }}><input aria-label="Subtask title" required value={editingSubtask.title} onChange={e => setEditingSubtask({ index, title: e.target.value })} /><button disabled={busy || !editingSubtask.title.trim()}>Save</button><button type="button" onClick={() => setEditingSubtask(null)}>Cancel</button></form> :
          <><label><input type="checkbox" disabled={busy} checked={item.isDone} onChange={event => update({ subtasks: task.subtasks.map((sub,i) => i === index ? { ...sub, isDone: event.target.checked } : sub) })} />{item.title}</label>
            <div className="actions"><button disabled={busy} onClick={() => setEditingSubtask({ index, title: item.title })}>Edit</button><button disabled={busy} onClick={() => update({ subtasks: task.subtasks.filter((_,i) => i !== index) })}>Remove</button></div></>}
      </div>)}
      <form className="inline-form" onSubmit={event => { event.preventDefault(); run(saveTask({ id: task.id, subtasks: [...task.subtasks, { title: subtask.trim(), isDone: false }] }), () => setSubtask("")); }}>
        <input aria-label="New subtask" value={subtask} onChange={e => setSubtask(e.target.value)} placeholder="Add a subtask" required /><button disabled={busy || !subtask.trim()}>Add subtask</button>
      </form>
    </section>
    <section className="task-card"><h2>Attachments</h2>
      {task.attachments.map((item,index) => <div key={item._id || index} className="subtask-row"><a href={item.link} target="_blank" rel="noreferrer">{item.file_name}</a><button disabled={busy} onClick={() => update({ attachments: task.attachments.filter((_,i) => i !== index) })}>Remove</button></div>)}
      <form className="inline-form" onSubmit={event => { event.preventDefault(); if (!/^https?:\/\//i.test(attachment.link)) { setError("Use an http or https attachment URL"); return; } run(saveTask({ id: task.id, attachments: [...task.attachments, attachment] }), () => setAttachment({ file_name: "", link: "" })); }}>
        <input aria-label="Attachment name" placeholder="Attachment name" value={attachment.file_name} onChange={e => setAttachment({ ...attachment, file_name: e.target.value })} required />
        <input aria-label="Attachment URL" placeholder="https://…" type="url" value={attachment.link} onChange={e => setAttachment({ ...attachment, link: e.target.value })} required /><button disabled={busy}>Add link</button>
      </form>
    </section>
    <section className="task-card"><h2>Comments ({task.comments.length})</h2>
      {task.comments.map((item,index) => <article className="comment" key={item.id || item._id || index}><p className="muted">{item.username || item.email} · {new Date(item.createdAt).toLocaleString()}</p><div className="markdown"><Markdown>{item.comment}</Markdown></div>
        {item.attachments?.map((file,i) => <a key={i} href={file.link} rel="noreferrer" target="_blank">{file.file_name}</a>)}
      </article>)}
      <form onSubmit={event => { event.preventDefault(); run(postComment({ id: task.id, comment: comment.trim() }), () => setComment("")); }}>
        <label>Add a comment<textarea rows={4} value={comment} maxLength={20000} onChange={e => setComment(e.target.value)} required /></label><button className="primary-button" disabled={busy || !comment.trim()}>Add comment</button>
      </form>
    </section>
  </>;
}
