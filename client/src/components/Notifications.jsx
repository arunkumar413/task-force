import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../constants";

export function Notifications() {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const root = useRef(null);
  const refresh = useCallback(async (signal) => {
    try {
      const response = await fetch(API_URL + "/notifications", { credentials: "include", signal });
      if (!response.ok) throw new Error("Unable to load notifications");
      const result = await response.json();
      if (signal?.aborted) return;
      setItems(result.data); setCount(result.unreadCount); setError("");
    } catch (err) { if (err.name !== "AbortError") setError(err.message); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => refresh(controller.signal);
    load();
    const timer = setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", load); };
  }, [refresh]);
  useEffect(() => {
    if (!open) return;
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === "Escape") { setOpen(false); root.current?.querySelector("button")?.focus(); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  async function markRead(id) {
    try {
      const response = await fetch(API_URL + (id ? `/notifications/${id}/read` : "/notifications/read-all"), { method: "PATCH", credentials: "include" });
      if (!response.ok) throw new Error("Unable to mark notifications as read");
      await refresh();
    } catch (err) { setError(err.message); }
  }
  return <div className="relative" ref={root}>
    <button type="button" className="relative rounded-lg p-2 text-lg text-slate-700 hover:text-primary" aria-label={`Notifications, ${count} unread`} aria-expanded={open} aria-controls="notifications-panel" onClick={() => { setOpen(value => !value); refresh(); }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      {count > 0 && <sup className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-1 text-xs text-white" aria-hidden="true">{count > 99 ? "99+" : count}</sup>}
    </button>
    {open && <section id="notifications-panel" aria-label="Notifications" className="absolute right-0 z-50 mt-2 max-h-96 w-80 max-w-[90vw] overflow-auto rounded-xl border border-slate-200 bg-surface p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between gap-2"><strong>Notifications</strong>{count > 0 && <button type="button" className="text-lg text-primary" onClick={() => markRead()}>Mark all read</button>}</div>
      {error && <p role="alert">{error} <button type="button" className="text-lg" onClick={() => refresh()}>Retry</button></p>}
      {!items.length && !error && <p className="text-sm text-slate-500">No notifications yet.</p>}
      <ul className="space-y-3">{items.map(item => <li key={item.id} className={`rounded-lg border border-slate-200 p-3 text-sm ${!item.readAt ? "font-semibold" : ""}`}>
        <Link to={`/task/${item.taskId}#comment-${item.commentId}`} onClick={() => { markRead(item.id); setOpen(false); }}>{item.actorName} mentioned you in a comment.</Link>
        <time className="mt-1 block text-xs font-normal text-slate-500" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
        {!item.readAt && <button type="button" className="mt-1 text-lg text-primary" onClick={() => markRead(item.id)}>Mark read</button>}
      </li>)}</ul>
    </section>}
  </div>;
}
