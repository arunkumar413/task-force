import { Button, Textarea, markdownClasses } from "./FormControls";
import React, { useId, useRef, useState } from "react";
import Markdown from "react-markdown";
export function MarkdownEditor({
  value,
  onChange
}) {
  const id = useId();
  const [activeTab, setActiveTab] = useState("edit");
  const tabs = useRef([]);
  const modes = ["edit", "preview"];
  function handleTabKey(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % modes.length;else if (event.key === "ArrowLeft") next = (index + modes.length - 1) % modes.length;else if (event.key === "Home") next = 0;else if (event.key === "End") next = modes.length - 1;else return;
    event.preventDefault();
    setActiveTab(modes[next]);
    tabs.current[next].focus();
  }
  return <div className="space-y-1.5">
    <label htmlFor={id + "-input"} className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">Description (Markdown)</label>
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-surface">
      <div className="flex gap-1 border-b border-slate-200 bg-slate-100 px-3" role="tablist" aria-label="Description editor">
        {modes.map((mode, index) => <Button key={mode} type="button" role="tab" id={id + "-" + mode + "-tab"} aria-controls={id + "-" + mode + "-panel"} aria-selected={activeTab === mode} tabIndex={activeTab === mode ? 0 : -1} ref={element => {
          tabs.current[index] = element;
        }} className="rounded-none border-0 border-b-2 border-transparent px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:text-primary aria-selected:border-primary aria-selected:text-primary focus-visible:-outline-offset-4" onClick={() => setActiveTab(mode)} onKeyDown={event => handleTabKey(event, index)}>{mode === "edit" ? "Edit" : "Preview"}</Button>)}
      </div>
      <div role="tabpanel" id={id + "-edit-panel"} aria-labelledby={id + "-edit-tab"} hidden={activeTab !== "edit"}>
        <Textarea id={id + "-input"} rows={9} name="description" maxLength={50000} value={value} onChange={onChange} placeholder="Write a description using Markdown…" className="block min-h-56 w-full resize-y border-0 bg-surface p-3.5 font-mono text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus-visible:-outline-offset-3" />
      </div>
      <div role="tabpanel" id={id + "-preview-panel"} aria-labelledby={id + "-preview-tab"} hidden={activeTab !== "preview"} tabIndex={0}>
        <div className={markdownClasses + " min-h-56 p-3.5 [&>:first-child]:mt-0 [&>:last-child]:mb-0"} data-testid="markdown">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-slate-500">Nothing to preview yet.</p>}
        </div>
      </div>
    </div>
  </div>;
}
