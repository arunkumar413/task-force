import React from "react";
import { Input, Button } from "./FormControls";

export function AttachmentPicker({ files, onChange, disabled, onError, label = "Attach files" }) {
  return <div className="space-y-2">
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">{label}<Input type="file" multiple disabled={disabled} onChange={event => {
      const selected = [...event.target.files];
      event.target.value = "";
      if (files.length + selected.length > 5 || selected.some(file => file.size > 10 * 1024 * 1024)) {
        onError("Attach up to 5 files, each 10 MB or smaller."); return;
      }
      onError(""); onChange([...files, ...selected]);
    }} /></label>
    <p className="text-xs text-slate-500">Up to 5 files, 10 MB each. Files upload when you submit.</p>
    <ul className="space-y-2">{files.map((file, index) => <li key={index} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
      <span className="min-w-0 break-all">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
      <Button type="button" disabled={disabled} aria-label={"Remove file " + file.name} onClick={() => onChange(files.filter((_, i) => i !== index))}>Remove</Button>
    </li>)}</ul>
  </div>;
}
