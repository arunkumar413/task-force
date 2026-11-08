import React, { useEffect, useId, useState } from "react";
import { Input } from "./FormControls";
import { API_URL } from "../constants";

const demoEmployees = [1, 2, 3].map(id => ({ id: String(id), name: "Demo user " + id }));
const employeeId = employee => String(employee.id || employee._id);

export function MultiAssigneeSelect({ selected = [], onChange, authenticated }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const employees = authenticated
          ? (await (async () => {
            const response = await fetch(API_URL + "/tasks/assignees?q=" + encodeURIComponent(query), { credentials: "include", signal: controller.signal });
            if (!response.ok) throw new Error("Unable to search employees");
            return (await response.json()).data;
          })())
          : demoEmployees.filter(employee => employee.name.toLowerCase().includes(query.toLowerCase()));
        if (!controller.signal.aborted) setOptions(employees);
      } catch (err) {
        if (!controller.signal.aborted) setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, query, authenticated]);
  function toggle(employee) {
    const value = employeeId(employee);
    onChange(selected.some(item => employeeId(item) === value)
      ? selected.filter(item => employeeId(item) !== value)
      : [...selected, employee]);
  }
  return <div className="relative flex flex-col gap-1.5 text-sm font-medium text-slate-700">
    <label htmlFor={id}>Assignees</label>
    <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-surface px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      {selected.map(employee => <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-sm" key={employeeId(employee)}>
        {employee.name || employee.username || employee.email}
        <button type="button" className="text-lg leading-none text-slate-500 hover:text-slate-900" aria-label={`Remove ${employee.name || employee.email}`} onMouseDown={event => event.preventDefault()} onClick={() => toggle(employee)}>×</button>
      </span>)}
      <Input id={id} role="combobox" className="min-w-32 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus:border-0 focus:ring-0" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={id + "-options"} value={query} placeholder={selected.length ? "Add another assignee" : "Search by name, email, or username"}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 0)} onChange={event => { setQuery(event.target.value); setOpen(true); }} onKeyDown={event => { if (event.key === "Escape") setOpen(false); }} />
    </div>
    {open && <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-surface shadow-lg">
      <p role="status" className="px-3 py-2 text-xs font-normal text-slate-500">{loading ? "Searching employees…" : error || (options.length ? "Select employees" : "No matching employees")}</p>
      <ul id={id + "-options"} role="listbox" aria-label="Organization employees" aria-multiselectable="true" className="max-h-64 overflow-y-auto">
        {options.map(employee => { const value = employeeId(employee); const checked = selected.some(item => employeeId(item) === value); return <li key={value} role="option" aria-selected={checked} className="cursor-pointer px-3 py-2 hover:bg-slate-100" onMouseDown={event => event.preventDefault()} onClick={() => toggle(employee)}>
          <span className="flex items-center gap-2"><input type="checkbox" tabIndex={-1} checked={checked} readOnly /> <span className="text-slate-900">{employee.name}</span></span>
          {employee.email && <span className="ml-6 block truncate text-xs font-normal text-slate-500">{employee.email}</span>}
        </li>; })}
      </ul>
    </div>}
  </div>;
}
