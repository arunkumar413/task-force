import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Header } from "../components/Header";
import { ChangePassword } from "../components/ChangePassword";
import { InviteTeam } from "../components/InviteTeam";
import { GrantAccess } from "../components/GrantAccess";
import { OrgHierarchy } from "../components/OrgHierarchy";
import { setUserInfo } from "../store/authSlice";
import { API_URL } from "../constants";
import { apiRequest } from "../store/apiClient";
import { selectApiResponse } from "../store/apiSlice";

const emptyForm = {
  name: "",
  username: "",
  email: "",
  designation: "",
  phone: "",
};

function formatSessionTime(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString();
}

function Detail({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-900">{value || "—"}</dd>
    </div>
  );
}

export function ProfilePage() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const profileResponse = useSelector((state) => selectApiResponse(state, "profile"));
  const hierarchyResponse = useSelector((state) => selectApiResponse(state, "hierarchy"));
  const profileData = profileResponse.data || {};
  const employee = profileData.employee || null;
  const departments = profileData.departments || [];
  const sessions = profileData.sessions || [];
  const access = profileData.access || { fullAccess: false, grants: [] };
  const hierarchy = hierarchyResponse.data || null;
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hierarchyError, setHierarchyError] = useState("");
  const [notice, setNotice] = useState("");
  const [departmentSavingId, setDepartmentSavingId] = useState("");

  useEffect(function () {
    async function load() {
      setError("");
      setHierarchyError("");
      try {
        const [profileRes, hierarchyRes] = await Promise.all([
          apiRequest(dispatch, "profile", `${API_URL}/profile`, { credentials: "include" }),
          apiRequest(dispatch, "hierarchy", `${API_URL}/hierarchy`, { credentials: "include" }),
        ]);

        if (profileRes.response.status === 401) {
          setError("Please sign in to view your profile.");
          return;
        }
        if (!profileRes.response.ok) {
          setError("Unable to load profile.");
          return;
        }

        const profileResult = profileRes.payload;
        const nextEmployee = profileResult.data.employee;
        setForm({
          name: nextEmployee.name || "",
          username: nextEmployee.username || "",
          email: nextEmployee.email || "",
          designation: nextEmployee.designation || "",
          phone: nextEmployee.phone || "",
        });

        if (hierarchyRes.response.status === 403) {
          setHierarchyError(
            "You do not have permission to view the organization hierarchy."
          );
        } else if (!hierarchyRes.response.ok && hierarchyRes.response.status !== 401) {
          setHierarchyError("Unable to load hierarchy.");
        }
      } catch (err) {
        setError("Unable to load profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleChange(evt) {
    const { name, value } = evt.target;
    setForm(function (prev) {
      return { ...prev, [name]: value };
    });
  }

  function startEdit() {
    setNotice("");
    setError("");
    setEditing(true);
  }

  function cancelEdit() {
    if (!employee) {
      return;
    }
    setForm({
      name: employee.name || "",
      username: employee.username || "",
      email: employee.email || "",
      designation: employee.designation || "",
      phone: employee.phone || "",
    });
    setError("");
    setEditing(false);
  }

  async function handleSave(evt) {
    evt.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const result = await apiRequest(dispatch, "profile", `${API_URL}/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!result.response.ok) {
        setError(result.payload.statusMessage || "Unable to update profile.");
        return;
      }

      const nextEmployee = result.payload.data.employee;
      setForm({
        name: nextEmployee.name || "",
        username: nextEmployee.username || "",
        email: nextEmployee.email || "",
        designation: nextEmployee.designation || "",
        phone: nextEmployee.phone || "",
      });
      setEditing(false);
      setNotice("Profile updated.");

      if (result.payload.data.session) {
        const stored = JSON.parse(localStorage.getItem("userInfo") || "{}");
        const nextAuth = { ...stored, ...result.payload.data.session };
        localStorage.setItem("userInfo", JSON.stringify(nextAuth));
        dispatch(setUserInfo(nextAuth));
      }

      await reloadHierarchy();
      await apiRequest(dispatch, "profile", `${API_URL}/profile`, { credentials: "include" });
    } catch (err) {
      setError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function reloadHierarchy() {
    const hierarchyResult = await apiRequest(dispatch, "hierarchy", `${API_URL}/hierarchy`, {
      credentials: "include",
    });
    return hierarchyResult;
  }

  async function handleDepartmentChange(employeeId, departmentId) {
    setDepartmentSavingId(employeeId);
    setHierarchyError("");
    try {
      const result = await apiRequest(dispatch, "updateDepartment", `${API_URL}/employees/${employeeId}/department`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId }),
      });
      if (!result.response.ok) {
        setHierarchyError(result.payload.statusMessage || "Unable to update department.");
        return;
      }
      await reloadHierarchy();
      await apiRequest(dispatch, "profile", `${API_URL}/profile`, {
        credentials: "include",
      });
    } catch (err) {
      setHierarchyError("Unable to update department.");
    } finally {
      setDepartmentSavingId("");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {loading && <p className="text-sm text-slate-500">Loading profile…</p>}
        {error && !employee && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {employee && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Your profile</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                  {employee.name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {employee.organization?.name || "Your organization"}
                </p>
              </div>
              {!editing && (
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                  onClick={startEdit}
                >
                  Edit profile
                </button>
              )}
            </div>

            {notice && (
              <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {notice}
              </p>
            )}
            {error && editing && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {editing ? (
              <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSave}>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Name</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Username</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Email</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Phone number</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Designation</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                  />
                </label>
                <div className="block text-sm">
                  <span className="font-medium text-slate-700">Department</span>
                  <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    {employee.departmentName || "Company-wide / unassigned"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Only your manager can change this.
                  </p>
                </div>
                <div className="flex gap-3 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Email" value={employee.email} />
                <Detail label="Designation" value={employee.designation} />
                <Detail label="Department" value={employee.departmentName} />
                <Detail label="Phone number" value={employee.phone} />
                <Detail label="Username" value={employee.username} />
                <Detail label="Reports to" value={employee.managerName} />
                <Detail
                  label="Roles"
                  value={(employee.roles || []).join(", ")}
                />
              </dl>
            )}
          </section>
        )}

        {employee && <ChangePassword email={employee.email} />}

        {employee &&
          employee.departmentId &&
          (access.fullAccess ||
            (access.grants || []).some(function (grant) {
              return (
                grant.key === "employee" &&
                (grant.actions || []).includes("write")
              );
            })) && (
            <InviteTeam
              departmentName={employee.departmentName}
              departmentId={employee.departmentId}
              departments={departments}
            />
          )}

        {employee && GrantAccess.canManageAccess(access) && <GrantAccess />}

        {employee && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Resource access
            </h2>
            <p className="mt-1 mb-5 text-sm text-slate-500">
              Permissions come from your roles and are granted per resource.
            </p>
            {access.fullAccess ? (
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                Full access to every resource, including newly added ones.
              </p>
            ) : access.grants.length === 0 ? (
              <p className="text-sm text-slate-500">
                No resource permissions assigned.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {access.grants.map(function (grant) {
                  return (
                    <li
                      key={grant.key}
                      className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {grant.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {grant.key}
                          {grant.description ? ` · ${grant.description}` : ""}
                        </p>
                      </div>
                      <span className="flex flex-wrap gap-1">
                        {(grant.actions || []).map(function (action) {
                          return (
                            <span
                              key={action}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                            >
                              {action}
                            </span>
                          );
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {employee && (
          <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Signed-in devices
            </h2>
            <p className="mt-1 mb-5 text-sm text-slate-500">
              Each device keeps its own session. You can stay signed in on more
              than one at a time.
            </p>
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500">No active sessions.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sessions.map(function (session) {
                  return (
                    <li
                      key={session.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {session.device}
                          {session.current ? (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                              This device
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          IP {session.ip || "—"}
                        </p>
                        {session.userAgent ? (
                          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-400">
                            {session.userAgent}
                          </p>
                        ) : null}
                      </div>
                      <dl className="grid gap-1 text-xs text-slate-500 sm:text-right">
                        <div>
                          <dt className="inline font-medium text-slate-600">
                            Signed in
                          </dt>
                          <dd className="inline">
                            {" "}
                            {formatSessionTime(session.createdAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-slate-600">
                            Last active
                          </dt>
                          <dd className="inline">
                            {" "}
                            {formatSessionTime(session.lastSeenAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-slate-600">
                            Expires
                          </dt>
                          <dd className="inline">
                            {" "}
                            {formatSessionTime(session.expiresAt)}
                          </dd>
                        </div>
                      </dl>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {hierarchyError && (
          <p className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {hierarchyError}
          </p>
        )}
        <OrgHierarchy
          data={hierarchy}
          currentEmail={employee?.email || auth.email}
          departmentOptions={departments}
          savingId={departmentSavingId}
          onChangeDepartment={handleDepartmentChange}
        />
      </main>
    </div>
  );
}

