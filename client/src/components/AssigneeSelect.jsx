import React, { useEffect, useId, useState } from "react";
import { Input } from "./FormControls";
import { API_URL } from "../constants";

export function AssigneeSelect({ selected, onChange, authenticated }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(selected.name);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setOptions([]);
    setActive(-1);
    const timer = setTimeout(async () => {
      try {
        let employees;
        if (authenticated) {
          const response = await fetch(API_URL + "/tasks/assignees?q=" + encodeURIComponent(query), { credentials: "include", signal: controller.signal });
          if (!response.ok) throw new Error("Unable to search employees. Close and reopen to retry.");
          employees = (await response.json()).data;
        } else {
          employees = [1, 2, 3].map(value => ({ id: String(value), name: "Demo user " + value })).filter(employee => employee.name.toLowerCase().includes(query.toLowerCase()));
        }
        if (!controller.signal.aborted) setOptions(employees);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, query, authenticated]);
  function close() { setOpen(false); setQuery(selected.name); setActive(-1); }
  function choose(employee) { onChange(employee); setQuery(employee.name); setOpen(false); setActive(-1); }
  return <div className="relative flex flex-col gap-1.5 text-sm font-medium text-slate-700">
    <label htmlFor={id}>Assignee</label>
    <Input id={id} role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={id + "-options"} aria-activedescendant={open && active >= 0 ? id + "-option-" + active : undefined} value={query}
      placeholder="Search by name, email, or username"
      onFocus={() => { setOpen(true); setQuery(""); }}
      onChange={event => { setQuery(event.target.value); setOpen(true); }} onBlur={close}
      onKeyDown={event => {
        if (event.key === "Escape") { event.preventDefault(); close(); }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault(); setOpen(true);
          setActive(current => options.length ? (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length : -1);
        }
        if (event.key === "Enter" && open) { event.preventDefault(); if (options[active]) choose(options[active]); }
      }} />
    {open && <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-lg">
      <p role="status" className="px-3 py-2 text-xs font-normal text-slate-500">{loading ? "Searching employees…" : error || (options.length ? "Select an employee · type to narrow results" : "No matching employees")}</p>
      <ul id={id + "-options"} role="listbox" aria-label="Organization employees" className="max-h-64 overflow-y-auto">
        {options.map((employee, index) => <li key={employee.id} id={id + "-option-" + index} role="option" aria-selected={employee.id === selected.id}
          className={"cursor-pointer px-3 py-2 hover:bg-slate-100 " + (active === index ? "bg-slate-100" : "")}
          onMouseDown={event => event.preventDefault()} onClick={() => choose(employee)}>
          <span className="block text-slate-900">{employee.name}</span>
          {employee.email && <span className="block truncate text-xs font-normal text-slate-500">{employee.email}</span>}
        </li>)}
      </ul>
    </div>}
  </div>;
}
