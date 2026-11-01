import { Button, markdownClasses, Input } from "../components/FormControls";
import { MarkdownEditor } from "../components/MarkdownEditor";
import React, { useState } from "react";
import Markdown from "react-markdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { deleteTask, postComment, saveTask } from "../store/tasksFilterSlice";
export function TaskPage() {
  const {
    task_id
  } = useParams();
  const {
    items,
    loaded,
    error: loadError
  } = useSelector(state => state.tasks);
  const task = items.find(item => item.id === task_id);
  const [comment, setComment] = useState("");
  const [subtask, setSubtask] = useState("");
  const [attachment, setAttachment] = useState({
    file_name: "",
    link: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  async function run(action, after) {
    setBusy(true);
    setError("");
    try {
      await dispatch(action).unwrap();
      after?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (!loaded) return <p>{loadError || "Loading task…"}</p>;
  if (!task) return <p>Task not found. <Link to="/">Back to tasks</Link></p>;
  const update = patch => run(saveTask({
    id: task.id,
    ...patch
  }));
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 [&_h1]:mb-1"><div><Link to="/">← Tasks</Link><h1 className="mb-5 text-3xl font-semibold tracking-tight text-slate-900">{task.title}</h1></div><div className="flex flex-wrap items-center gap-3"><Link className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" to={"/task/" + task.id + "/edit"}>Edit task</Link><Button onClick={() => setDeleting(true)}>Delete</Button></div></div>
    {error && <p role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {deleting && <div className="mb-5 rounded-xl border border-slate-200 bg-surface p-6"><p>Delete this task and its comments?</p><div className="flex flex-wrap items-center gap-3"><Button disabled={busy} onClick={() => run(deleteTask(task.id), () => navigate("/"))}>Delete task</Button><Button onClick={() => setDeleting(false)}>Keep task</Button></div></div>}
    <div className="mb-5 rounded-xl border border-slate-200 bg-surface p-6">
      <dl className="mb-5 grid grid-cols-2 gap-4 border-b border-slate-200 pb-5 sm:grid-cols-[repeat(4,max-content)] sm:justify-between [&_dt]:text-xs [&_dt]:text-slate-500 [&_dd]:mt-1"><div><dt>Priority</dt>
      <dd className="font-bold">{task.priority}</dd></div><div>
        <dt>Status</dt><dd className="font-bold">{task.status}</dd>
        </div><div><dt>Assignee</dt>
        <dd className="font-bold">{task.user || "—"}</dd>
        </div><div><dt>Due date</dt>
        <dd className="font-bold">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}</dd></div></dl>
      <div className={markdownClasses + " "} data-testid="markdown"><Markdown>{task.description || "No description yet."}</Markdown></div>
      <div className="flex flex-wrap items-center gap-3">{task.labels?.map(label => <span className="rounded-md bg-slate-100 px-2 py-1 text-xs" key={label}>{label}</span>)}</div>
    </div>
    <details open className="group/subtasks mb-5 rounded-xl border border-slate-200 bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-6 text-slate-900 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-semibold tracking-tight">Subtasks ({task.subtasks.length})</h2>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-5 shrink-0 text-slate-500 transition-transform group-open/subtasks:rotate-180">
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="px-6 pb-6">
      {task.subtasks.map((item, index) => <div className="flex items-center justify-between gap-3 border-b border-slate-200 py-2.5 [&_label]:inline-flex [&_label]:flex-row [&_label]:items-center [&_label]:gap-3" key={item._id || item.id || index}>
        {editingSubtask?.index === index ? <form className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center [&_input]:min-w-0 [&_input]:flex-1 [&_button]:shrink-0 [&_button]:whitespace-nowrap" onSubmit={event => {
          event.preventDefault();
          run(saveTask({
            id: task.id,
            subtasks: task.subtasks.map((sub, i) => i === index ? {
              ...sub,
              title: editingSubtask.title.trim()
            } : sub)
          }), () => setEditingSubtask(null));
        }}><Input aria-label="Subtask title" required value={editingSubtask.title} onChange={e => setEditingSubtask({
            index,
            title: e.target.value
          })} /><Button disabled={busy || !editingSubtask.title.trim()}>Save</Button><Button type="button" onClick={() => setEditingSubtask(null)}>Cancel</Button></form> : <><label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700"><Input type="checkbox" disabled={busy} checked={item.isDone} onChange={event => update({
              subtasks: task.subtasks.map((sub, i) => i === index ? {
                ...sub,
                isDone: event.target.checked
              } : sub)
            })} />{item.title}</label>
            <div className="flex flex-wrap items-center gap-3"><Button disabled={busy} onClick={() => setEditingSubtask({
              index,
              title: item.title
            })}>Edit</Button><Button disabled={busy} onClick={() => update({
              subtasks: task.subtasks.filter((_, i) => i !== index)
            })}>Remove</Button></div></>}
      </div>)}
      <form className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center [&_input]:min-w-0 [&_input]:flex-1 [&_button]:shrink-0 [&_button]:whitespace-nowrap" onSubmit={event => {
        event.preventDefault();
        run(saveTask({
          id: task.id,
          subtasks: [...task.subtasks, {
            title: subtask.trim(),
            isDone: false
          }]
        }), () => setSubtask(""));
      }}>
        <Input aria-label="New subtask" value={subtask} onChange={e => setSubtask(e.target.value)} placeholder="Add a subtask" required /><Button disabled={busy || !subtask.trim()}>Add subtask</Button>
      </form>
      </div>
    </details>
    <section className="mb-5 rounded-xl border border-slate-200 bg-surface p-6"><h2 className="mb-3.5 text-lg font-semibold tracking-tight text-slate-900">Attachments</h2>
      {task.attachments.map((item, index) => <div key={item._id || index} className="flex items-center justify-between gap-3 border-b border-slate-200 py-2.5 [&_label]:inline-flex [&_label]:flex-row [&_label]:items-center [&_label]:gap-3"><a href={item.link} target="_blank" rel="noreferrer">{item.file_name}</a><Button disabled={busy} onClick={() => update({
          attachments: task.attachments.filter((_, i) => i !== index)
        })}>Remove</Button></div>)}
      <form className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center [&_input]:min-w-0 [&_input]:flex-1 [&_button]:shrink-0 [&_button]:whitespace-nowrap" onSubmit={event => {
        event.preventDefault();
        if (!/^https?:\/\//i.test(attachment.link)) {
          setError("Use an http or https attachment URL");
          return;
        }
        run(saveTask({
          id: task.id,
          attachments: [...task.attachments, attachment]
        }), () => setAttachment({
          file_name: "",
          link: ""
        }));
      }}>
        <Input aria-label="Attachment name" placeholder="Attachment name" value={attachment.file_name} onChange={e => setAttachment({
          ...attachment,
          file_name: e.target.value
        })} required />
        <Input aria-label="Attachment URL" placeholder="https://…" type="url" value={attachment.link} onChange={e => setAttachment({
          ...attachment,
          link: e.target.value
        })} required /><Button disabled={busy}>Add link</Button>
      </form>
    </section>
    <section className="mb-5 rounded-xl border border-slate-200 bg-surface p-6"><h2 className="mb-3.5 text-lg font-semibold tracking-tight text-slate-900">Comments ({task.comments.length})</h2>
      {task.comments.map((item, index) => <article className="mb-4 border-b border-slate-200 py-4" key={item.id || item._id || index}><p className="text-sm text-slate-500">{item.username || item.email} · {new Date(item.createdAt).toLocaleString()}</p><div className={markdownClasses + " "} data-testid="markdown"><Markdown>{item.comment}</Markdown></div>
        {item.attachments?.map((file, i) => <a key={i} href={file.link} rel="noreferrer" target="_blank">{file.file_name}</a>)}
      </article>)}
      <form className="space-y-3" onSubmit={event => {
        event.preventDefault();
        run(postComment({
          id: task.id,
          comment: comment.trim()
        }), () => setComment(""));
      }}>
        <MarkdownEditor label="Add a comment" name="comment" rows={4} maxLength={20000} value={comment} onChange={e => setComment(e.target.value)} disabled={busy} placeholder="Write a comment using Markdown…" previewTestId="comment-preview" /><Button className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || !comment.trim()}>Add comment</Button>
      </form>
    </section>
  </>;
}
