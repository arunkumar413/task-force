import { Select, Input, Button } from "./FormControls";
import React, { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API_URL } from "../constants";
import { apiRequest } from "../store/apiClient";
import { clearApiResponse, selectApiResponse } from "../store/apiSlice";
const SAMPLE_CSV = "name,email,designation\nAlex Rivera,alex.rivera@acme.example,Backend Engineer\n";
function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}
export function parseInviteCsv(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter(function (line) {
    return line.trim().length > 0;
  });
  if (lines.length < 2) {
    return {
      rows: [],
      error: "Add a header row and at least one person."
    };
  }
  const header = splitCsvLine(lines[0]).map(function (cell) {
    return cell.toLowerCase();
  });
  const nameIdx = header.indexOf("name");
  const emailIdx = header.indexOf("email");
  const designationIdx = header.indexOf("designation");
  const phoneIdx = header.indexOf("phone");
  if (nameIdx < 0 || emailIdx < 0) {
    return {
      rows: [],
      error: "CSV must include name and email columns."
    };
  }
  const rows = lines.slice(1).map(function (line, index) {
    const cells = splitCsvLine(line);
    return {
      index: index + 1,
      name: cells[nameIdx] || "",
      email: cells[emailIdx] || "",
      designation: designationIdx >= 0 ? cells[designationIdx] || "" : "",
      phone: phoneIdx >= 0 ? cells[phoneIdx] || "" : ""
    };
  });
  return {
    rows,
    error: ""
  };
}
export function InviteTeam({
  departmentName,
  departmentId,
  departments = []
}) {
  const activeReader = useRef(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [targetDepartmentId, setTargetDepartmentId] = useState(departmentId || "");
  const [roleName, setRoleName] = useState("Employee");
  const dispatch = useDispatch();
  const inviteResponse = useSelector(state => selectApiResponse(state, "inviteTeam"));
  const storedResult = inviteResponse.data;
  const preview = useMemo(function () {
    return rows.slice(0, 25);
  }, [rows]);
  function handleFile(evt) {
    if (activeReader.current) {
      activeReader.current.abort();
      activeReader.current = null;
    }
    const file = evt.target.files && evt.target.files[0];
    dispatch(clearApiResponse("inviteTeam"));
    setNotice("");
    setError("");
    setParseError("");
    setRows([]);
    setFileName("");
    if (!file) {
      return;
    }
    setFileName(file.name);
    // Allow selecting the same file again after correcting or retrying it.
    evt.target.value = "";
    const reader = new FileReader();
    activeReader.current = reader;
    reader.onload = function () {
      if (activeReader.current !== reader) return;
      activeReader.current = null;
      const parsed = parseInviteCsv(String(reader.result || ""));
      if (parsed.error) {
        setParseError(parsed.error);
        return;
      }
      setRows(parsed.rows);
    };
    reader.onerror = function () {
      if (activeReader.current !== reader) return;
      activeReader.current = null;
      setParseError("Unable to read the CSV. Please select the file again.");
    };
    reader.readAsText(file);
  }
  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "team-invite.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function handleInvite() {
    setSending(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(dispatch, "inviteTeam", `${API_URL}/employees/invite`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rows,
          departmentId: targetDepartmentId || departmentId,
          roleName
        })
      });
      if (!result.response.ok) {
        setError(result.payload.statusMessage || "Unable to invite teammates.");
        return;
      }
      setNotice(result.payload.statusMessage);
      setRows([]);
      setFileName("");
    } catch (err) {
      setError("Unable to invite teammates.");
    } finally {
      setSending(false);
    }
  }
  return <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Invite teammates</h2>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Upload a CSV of people to add to{" "}
        <span className="font-medium text-slate-700">
          {departmentName || "your department"}
        </span>
        . They will report to you and receive an invite code to set a password.
      </p>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Department</span>
          <Select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" value={targetDepartmentId || departmentId || ""} onChange={evt => setTargetDepartmentId(evt.target.value)}>
            {departments.length === 0 && <option value={departmentId || ""}>{departmentName || "Your department"}</option>}
            {departments.map(function (department) {
            return <option key={department.id} value={department.id}>
                  {department.name}
                </option>;
          })}
          </Select>
          <span className="mt-1 block text-xs text-slate-400">
            Managers can choose their department or a child department.
          </span>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Access level</span>
          <Select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" value={roleName} onChange={evt => setRoleName(evt.target.value)}>
            <option value="Employee">Employee</option>
            <option value="Manager">Manager (can invite)</option>
          </Select>
        </label>
      </div>

      {notice && <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>}
      {(error || parseError) && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || parseError}
        </p>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Choose CSV
          <Input className="sr-only" type="file" disabled={sending} accept=".csv,text/csv" onChange={handleFile} />
        </label>
        <Button type="button" className="text-sm font-medium text-slate-700 underline-offset-2 hover:underline" onClick={downloadSample}>
          Download sample
        </Button>
        {fileName && <span className="text-sm text-slate-500">{fileName}</span>}
      </div>

      {rows.length > 0 && <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr className="group">
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Designation</th>
              </tr>
            </thead>
            <tbody>
              {preview.map(function (row) {
            return <tr key={`${row.index}-${row.email}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-900">{row.name}</td>
                    <td className="px-3 py-2 text-slate-700">{row.email}</td>
                    <td className="px-3 py-2 text-slate-700">{row.designation || "—"}</td>
                  </tr>;
          })}
            </tbody>
          </table>
          {rows.length > preview.length && <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              Showing {preview.length} of {rows.length} rows.
            </p>}
        </div>}

      <Button type="button" disabled={sending || rows.length === 0} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60" onClick={handleInvite}>
        {sending ? "Inviting…" : `Invite ${rows.length} to ${departmentName || "your department"}`}
      </Button>

      {storedResult && (storedResult.created?.length > 0 || storedResult.errors?.length > 0) && <div className="mt-5 space-y-3 text-sm">
          {storedResult.created?.length > 0 && <p className="text-slate-700">
              Created {storedResult.created.length}.{" "}
              {storedResult.created.some(function (item) {
          return !item.emailed;
        }) ? "SMTP is not configured, so invite codes are in the server log." : "Invite codes were emailed."}
            </p>}
          {storedResult.errors?.length > 0 && <ul className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
              {storedResult.errors.map(function (item) {
          return <li key={`${item.row}-${item.email}`}>
                    Row {item.row}
                    {item.email ? ` (${item.email})` : ""}: {item.message}
                  </li>;
        })}
            </ul>}
        </div>}
    </section>;
}
