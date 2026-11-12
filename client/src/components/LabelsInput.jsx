import React, { useEffect, useId, useRef, useState } from "react";
import { Input } from "./FormControls";

export function LabelsInput({ value, onChange, suggestions = [], disabled = false, lockedLabel = "" }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef(null);
  const query = draft.trim();
  const available = [...new Set(suggestions)].filter(label => !value.includes(label));
  const matches = available.filter(label => label.toLowerCase().includes(query.toLowerCase()));
  const canCreate = query && ![...suggestions, ...value].some(label => label.toLowerCase() === query.toLowerCase());
  const options = [...matches.map(label => ({ label, create: false })), ...(canCreate ? [{ label: query, create: true }] : [])];
  const expanded = open && !disabled;
  useEffect(() => {
    if (expanded && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, expanded]);
  function choose(label) {
    if (label && !value.includes(label)) onChange([...value, label]);
    setDraft("");
    setActive(-1);
    setOpen(false);
  }
  return <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-medium text-slate-700">Labels</label>
    <div className="flex flex-wrap gap-2" aria-label="Selected labels">
      {value.map(label => <span key={label} className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
        <span className="break-all">{label}</span>
      {label === lockedLabel ? <span aria-label={"Required department label " + label} className="text-xs opacity-70">Required</span> : <button type="button" aria-label={"Remove label " + label} onClick={() => onChange(value.filter(item => item !== label))} className="rounded px-1 text-lg hover:bg-primary/10">×</button>}
      </span>)}
    </div>
    <div className="relative">
      <Input id={id} value={draft} disabled={disabled} role="combobox" autoComplete="off" aria-autocomplete="list"
        aria-expanded={expanded} aria-controls={id + "-suggestions"} aria-activedescendant={expanded && options[active] ? id + "-option-" + active : undefined}
        aria-describedby={id + "-hint"} placeholder="Search or create a label…" maxLength={1000}
        onFocus={() => setOpen(true)} onBlur={() => { setOpen(false); setActive(-1); }}
        onChange={event => { setDraft(event.target.value); setActive(-1); setOpen(true); }} onKeyDown={event => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive(current => {
              if (!options.length) return -1;
              if (current < 0) return event.key === "ArrowDown" ? 0 : options.length - 1;
              return (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length;
            });
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const exact = available.find(label => label.toLowerCase() === query.toLowerCase());
            choose(expanded && options[active] ? options[active].label : exact || query);
          }
        }} />
      {expanded && <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-surface shadow-xl ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
          <span className="text-xs font-semibold tracking-wide text-slate-500">Organization labels</span>
          <span className="text-xs text-slate-400">{matches.length} available</span>
        </div>
        <ul ref={listRef} id={id + "-suggestions"} role="listbox" aria-label="Label suggestions" className="max-h-60 overflow-y-auto p-1.5">
          {options.map((option, index) => <li key={option.label} id={id + "-option-" + index} role="option" aria-selected={active === index}
            onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => choose(option.label)}
            className={"flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors " + (active === index ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-50") + (option.create && matches.length ? " mt-1 border-t border-slate-100" : "")}>
            <span aria-hidden="true" className={"flex size-7 shrink-0 items-center justify-center rounded-md text-base " + (option.create ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400")}>{option.create ? "+" : "#"}</span>
            <span className="min-w-0 flex-1 break-all">{option.create ? <>Create <span className="font-medium">“{option.label}”</span></> : option.label}</span>
            {active === index && <span aria-hidden="true" className="shrink-0 text-xs text-primary">↵</span>}
          </li>)}
          {!options.length && <li className="px-3 py-5 text-center text-sm text-slate-500" role="presentation">{query ? "This label is already selected." : "Type to create your first label."}</li>}
        </ul>
        <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">↑ ↓ to browse · Enter to select · Esc to close</p>
      </div>}
    </div>
    <p id={id + "-hint"} className="text-xs text-slate-500">Select a suggestion or press Enter to add a new label.{lockedLabel && " The default department label cannot be removed."}</p>
  </div>;
}
