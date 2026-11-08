import React, { useId, useState } from "react";
import { Input } from "./FormControls";

export function LabelsInput({ value, onChange, suggestions = [], disabled = false, lockedLabel = "" }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  return <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-slate-700">Labels</label>
    <div className="flex flex-wrap gap-2" aria-label="Selected labels">
      {value.map(label => <span key={label} className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
        <span className="break-all">{label}</span>
      {label === lockedLabel ? <span aria-label={"Required department label " + label} className="text-xs opacity-70">Required</span> : <button type="button" aria-label={"Remove label " + label} onClick={() => onChange(value.filter(item => item !== label))} className="rounded px-1 text-lg hover:bg-primary/10">×</button>}
      </span>)}
    </div>
    <Input id={id} value={draft} disabled={disabled} list={id + "-suggestions"} aria-describedby={id + "-hint"} placeholder="Type a label and press Enter" maxLength={1000}
      onChange={event => setDraft(event.target.value)} onKeyDown={event => {
        if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
        event.preventDefault();
        const label = draft.trim();
        if (label && !value.includes(label)) onChange([...value, label]);
        setDraft("");
      }} />
    <datalist id={id + "-suggestions"}>{suggestions.filter(label => !value.includes(label)).map(label => <option key={label} value={label} />)}</datalist>
    <p id={id + "-hint"} className="text-xs text-slate-500">Press Enter to add each label. The default department label cannot be removed.</p>
  </div>;
}
