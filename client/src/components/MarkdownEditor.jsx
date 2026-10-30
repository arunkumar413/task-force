import React, { useId, useRef, useState } from "react";
import Markdown from "react-markdown";

export function MarkdownEditor({ value, onChange }) {
  const id = useId();
  const [activeTab, setActiveTab] = useState("edit");
  const tabs = useRef([]);
  const modes = ["edit", "preview"];

  function handleTabKey(event, index) {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % modes.length;
    else if (event.key === "ArrowLeft") next = (index + modes.length - 1) % modes.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = modes.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(modes[next]);
    tabs.current[next].focus();
  }

  return <div className="description-field">
    <label htmlFor={id + "-input"}>Description (Markdown)</label>
    <div className="markdown-editor">
      <div className="markdown-editor-tabs" role="tablist" aria-label="Description editor">
        {modes.map((mode, index) => <button
          key={mode}
          type="button"
          role="tab"
          id={id + "-" + mode + "-tab"}
          aria-controls={id + "-" + mode + "-panel"}
          aria-selected={activeTab === mode}
          tabIndex={activeTab === mode ? 0 : -1}
          ref={element => { tabs.current[index] = element; }}
          className="markdown-editor-tab"
          onClick={() => setActiveTab(mode)}
          onKeyDown={event => handleTabKey(event, index)}
        >{mode === "edit" ? "Edit" : "Preview"}</button>)}
      </div>
      <div role="tabpanel" id={id + "-edit-panel"} aria-labelledby={id + "-edit-tab"} hidden={activeTab !== "edit"}>
        <textarea
          id={id + "-input"}
          rows={9}
          name="description"
          maxLength={50000}
          value={value}
          onChange={onChange}
          placeholder="Write a description using Markdown…"
        />
      </div>
      <div role="tabpanel" id={id + "-preview-panel"} aria-labelledby={id + "-preview-tab"} hidden={activeTab !== "preview"} tabIndex={0}>
        <div className="markdown markdown-editor-preview">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="muted">Nothing to preview yet.</p>}
        </div>
      </div>
    </div>
  </div>;
}
