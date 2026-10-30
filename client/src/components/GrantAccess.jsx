import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { API_URL } from "../constants";
import { apiRequest } from "../store/apiClient";
import { selectApiResponse } from "../store/apiSlice";

const ACTIONS = ["read", "write", "update", "delete"];

export function GrantAccess() {
  const dispatch = useDispatch();
  const catalogResponse = useSelector((state) => selectApiResponse(state, "accessCatalog"));
  const membersResponse = useSelector((state) => selectApiResponse(state, "accessMembers"));
  const resourcesResponse = useSelector((state) => selectApiResponse(state, "accessResources"));
  const catalog = catalogResponse.data;
  const members = membersResponse.data?.members || [];
  const resources = resourcesResponse.data?.resources || [];
  const [membersPagination, setMembersPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [memberSearch, setMemberSearch] = useState("");
  const [memberPage, setMemberPage] = useState(1);
  const [membersLoading, setMembersLoading] = useState(false);
  const [resourcesPagination, setResourcesPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourcePage, setResourcePage] = useState(1);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [savingMemberId, setSavingMemberId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadCatalog() {
    setError("");
    const result = await apiRequest(dispatch, "accessCatalog", `${API_URL}/access`, { credentials: "include" });
    const payload = result.payload;
    if (!result.response.ok) {
      throw new Error(payload.statusMessage || "Unable to load access settings.");
    }
    setSelectedRoleId(function (current) {
      if (current && payload.data.roles.some(function (role) {
        return role.id === current;
      })) {
        return current;
      }
      const firstEditable = payload.data.roles.find(function (role) {
        return !role.fullAccess;
      });
      return (firstEditable || payload.data.roles[0] || {}).id || "";
    });
  }

  async function loadMembers(page, search, signal) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(membersPagination.pageSize),
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    const result = await apiRequest(dispatch, "accessMembers", `${API_URL}/access/members?${params}`, {
      credentials: "include",
      signal,
    });
    const payload = result.payload;
    if (!result.response.ok) {
      throw new Error(payload.statusMessage || "Unable to load members.");
    }
    setMembersPagination(payload.data.pagination);
  }

  async function loadResources(page, search, signal) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(resourcesPagination.pageSize),
    });
    if (search.trim()) {
      params.set("search", search.trim());
    }
    const result = await apiRequest(dispatch, "accessResources", `${API_URL}/access/resources?${params}`, {
      credentials: "include",
      signal,
    });
    const payload = result.payload;
    if (!result.response.ok) {
      throw new Error(payload.statusMessage || "Unable to load resources.");
    }
    setResourcesPagination(payload.data.pagination);
  }

  useEffect(function () {
    loadCatalog().catch(function (err) {
      setError(err.message);
    }).finally(function () {
      setLoading(false);
    });
  }, []);

  useEffect(function () {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      setMembersLoading(true);
      loadMembers(memberPage, memberSearch, controller.signal)
        .catch(function (err) {
          if (err.name !== "AbortError") {
            setError(err.message);
          }
        })
        .finally(function () {
          if (!controller.signal.aborted) {
            setMembersLoading(false);
          }
        });
    }, 250);
    return function () {
      clearTimeout(timer);
      controller.abort();
    };
  }, [memberPage, memberSearch]);

  useEffect(function () {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      setResourcesLoading(true);
      loadResources(resourcePage, resourceSearch, controller.signal)
        .catch(function (err) {
          if (err.name !== "AbortError") {
            setError(err.message);
          }
        })
        .finally(function () {
          if (!controller.signal.aborted) {
            setResourcesLoading(false);
          }
        });
    }, 250);
    return function () {
      clearTimeout(timer);
      controller.abort();
    };
  }, [resourcePage, resourceSearch]);

  const selectedRole = (catalog?.roles || []).find(function (role) {
    return role.id === selectedRoleId;
  });

  async function handleRoleChange(memberId, roleId) {
    setSavingMemberId(memberId);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(dispatch, "updateMemberRole", `${API_URL}/access/members/${memberId}/role`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      const payload = result.payload;
      if (!result.response.ok) {
        setError(payload.statusMessage || "Unable to assign role.");
        return;
      }
      setNotice(payload.statusMessage);
      await loadMembers(memberPage, memberSearch);
    } catch (err) {
      setError("Unable to assign role.");
    } finally {
      setSavingMemberId("");
    }
  }

  async function toggleAction(resource, action) {
    if (!selectedRole || selectedRole.fullAccess) {
      return;
    }
    const current = selectedRole.grants[resource.id] || [];
    const next = current.includes(action)
      ? current.filter(function (item) {
          return item !== action;
        })
      : current.concat(action);
    setSavingKey(`${selectedRole.id}:${resource.key}`);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(dispatch, "updateRoleAccess", `${API_URL}/access/roles/${selectedRole.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceKey: resource.key, actions: next }),
      });
      const payload = result.payload;
      if (!result.response.ok) {
        setError(payload.statusMessage || "Unable to update role.");
        return;
      }
      setNotice(payload.statusMessage);
      await loadCatalog();
    } catch (err) {
      setError("Unable to update role.");
    } finally {
      setSavingKey("");
    }
  }

  if (loading) {
    return (
      <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <p className="text-sm text-slate-500">Loading access settings…</p>
      </section>
    );
  }

  if (!catalog) {
    return (
      <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <p className="text-sm text-red-700">{error || "Unable to load access settings."}</p>
      </section>
    );
  }

  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Roles and access</h2>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        Assign a role to each person. Then choose which resources that role can
        use. People inherit access from the role, not from one-off checkboxes.
      </p>

      {notice && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <h3 className="mb-2 text-sm font-semibold text-slate-900">People</h3>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 sm:w-80"
          type="search"
          value={memberSearch}
          placeholder="Search by name or email"
          aria-label="Search people by name or email"
          onChange={function (evt) {
            setMemberSearch(evt.target.value);
            setMemberPage(1);
          }}
        />
        <span className="text-sm text-slate-500">
          {membersPagination.total === 0
            ? "0 people"
            : `${(membersPagination.page - 1) * membersPagination.pageSize + 1}-${Math.min(
                membersPagination.page * membersPagination.pageSize,
                membersPagination.total
              )} of ${membersPagination.total}`}
        </span>
      </div>
      <div className="mb-8 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map(function (member) {
              return (
                <tr key={member.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {member.departmentName}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      value={member.roleIds[0] || ""}
                      disabled={savingMemberId === member.id}
                      onChange={function (evt) {
                        handleRoleChange(member.id, evt.target.value);
                      }}
                    >
                      {catalog.roles.map(function (role) {
                        return (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                </tr>
              );
            })}
            {!membersLoading && members.length === 0 && (
              <tr>
                <td colSpan="3" className="px-3 py-6 text-center text-sm text-slate-500">
                  No people match this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mb-8 flex items-center justify-end gap-3 text-sm text-slate-600">
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={memberPage <= 1 || membersLoading}
          onClick={function () {
            setMemberPage(function (page) { return page - 1; });
          }}
        >
          Previous
        </button>
        <span>Page {membersPagination.page} of {membersPagination.totalPages}</span>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={memberPage >= membersPagination.totalPages || membersLoading}
          onClick={function () {
            setMemberPage(function (page) { return page + 1; });
          }}
        >
          Next
        </button>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-slate-900">
        Role permissions
      </h3>
      <label className="mb-3 block text-sm">
        <span className="mr-2 text-slate-600">Role</span>
        <select
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900"
          value={selectedRoleId}
          onChange={function (evt) {
            setSelectedRoleId(evt.target.value);
          }}
        >
          {catalog.roles.map(function (role) {
            return (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            );
          })}
        </select>
      </label>

      {selectedRole?.fullAccess ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {selectedRole.name} has full access to every resource. You cannot
          restrict it here.
        </p>
      ) : (
        <>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 sm:w-80"
            type="search"
            value={resourceSearch}
            placeholder="Search resources by name or key"
            aria-label="Search resources by name or key"
            onChange={function (evt) {
              setResourceSearch(evt.target.value);
              setResourcePage(1);
            }}
          />
          <span className="text-sm text-slate-500">
            {resourcesPagination.total === 0
              ? "0 resources"
              : `${(resourcesPagination.page - 1) * resourcesPagination.pageSize + 1}-${Math.min(
                  resourcesPagination.page * resourcesPagination.pageSize,
                  resourcesPagination.total
                )} of ${resourcesPagination.total}`}
          </span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Resource</th>
                {ACTIONS.map(function (action) {
                  return (
                    <th key={action} className="px-3 py-2 font-medium capitalize">
                      {action}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {resources.map(function (resource) {
                const granted = selectedRole?.grants[resource.id] || [];
                const busy = savingKey === `${selectedRole?.id}:${resource.key}`;
                return (
                  <tr key={resource.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900">{resource.name}</p>
                      <p className="text-xs text-slate-400">{resource.key}</p>
                    </td>
                    {ACTIONS.map(function (action) {
                      return (
                        <td key={action} className="px-3 py-2">
                          <input
                            type="checkbox"
                            disabled={!selectedRole || busy}
                            checked={granted.includes(action)}
                            onChange={function () {
                              toggleAction(resource, action);
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {!resourcesLoading && resources.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-sm text-slate-500">
                    No resources match this search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-end gap-3 text-sm text-slate-600">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={resourcePage <= 1 || resourcesLoading}
            onClick={function () {
              setResourcePage(function (page) { return page - 1; });
            }}
          >
            Previous
          </button>
          <span>Page {resourcesPagination.page} of {resourcesPagination.totalPages}</span>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={resourcePage >= resourcesPagination.totalPages || resourcesLoading}
            onClick={function () {
              setResourcePage(function (page) { return page + 1; });
            }}
          >
            Next
          </button>
        </div>
        </>
      )}
    </section>
  );
}

function canManageAccess(access) {
  if (!access) {
    return false;
  }
  if (access.fullAccess) {
    return true;
  }
  return (access.grants || []).some(function (grant) {
    return grant.key === "role" && (grant.actions || []).includes("read");
  });
}

GrantAccess.canManageAccess = canManageAccess;

