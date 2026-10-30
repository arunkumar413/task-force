import React from "react";

function RoleBadges({ roles, inverted }) {
  if (!roles || roles.length === 0) {
    return (
      <span className={inverted ? "text-xs text-white/80" : "text-xs text-slate-400"}>
        No role
      </span>
    );
  }

  return (
    <span className="flex flex-wrap gap-1">
      {roles.map(function (role) {
        return (
          <span
            key={role}
            className={
              inverted
                ? "rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-white"
                : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
            }
          >
            {role}
          </span>
        );
      })}
    </span>
  );
}

function PersonRow({
  person,
  currentEmail,
  departmentOptions,
  savingId,
  onChangeDepartment,
}) {
  const isYou = person.email === currentEmail;

  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-1.5 " +
        (isYou ? "bg-primary text-white" : "bg-slate-50")
      }
    >
      <div className="min-w-0">
        <p className={"text-sm font-medium " + (isYou ? "text-white" : "text-slate-800")}>
          {person.name}
          {isYou ? " (you)" : ""}
        </p>
        <p className={"text-xs " + (isYou ? "text-white/80" : "text-slate-500")}>
          {[person.designation, person.email].filter(Boolean).join(" · ")}
        </p>
        {person.canChangeDepartment ? (
          <label className="mt-2 block text-xs">
            <span className={isYou ? "text-white/80" : "text-slate-500"}>
              Department
            </span>
            <select
              className="mt-1 w-full max-w-xs rounded border border-slate-300 bg-surface px-2 py-1 text-xs text-slate-800"
              value={person.departmentId || ""}
              disabled={savingId === person.id}
              onChange={function (evt) {
                onChangeDepartment(person.id, evt.target.value);
              }}
            >
              <option value="">Company-wide / unassigned</option>
              {(departmentOptions || []).map(function (department) {
                return (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                );
              })}
            </select>
          </label>
        ) : (
          person.departmentName && (
            <p className={"mt-1 text-xs " + (isYou ? "text-white/80" : "text-slate-400")}>
              {person.departmentName}
            </p>
          )
        )}
      </div>
      <RoleBadges roles={person.roles} inverted={isYou} />
    </div>
  );
}

function TreeList({ nodes, renderNode }) {
  if (!nodes || nodes.length === 0) {
    return <p className="text-sm text-slate-500">Nothing to show yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {nodes.map(function (node) {
        return (
          <li key={node.id} className="border-l-2 border-slate-200 pl-4">
            {renderNode(node)}
            {node.children && node.children.length > 0 && (
              <div className="mt-3">
                <TreeList nodes={node.children} renderNode={renderNode} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function OrgHierarchy({
  data,
  currentEmail,
  departmentOptions,
  savingId,
  onChangeDepartment,
}) {
  if (!data) {
    return null;
  }

  function renderPerson(person) {
    return (
      <PersonRow
        person={person}
        currentEmail={currentEmail}
        departmentOptions={departmentOptions}
        savingId={savingId}
        onChangeDepartment={onChangeDepartment}
      />
    );
  }

  return (
    <>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Organization</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {data.organization.name}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Slug <span className="font-mono">{data.organization.slug}</span>
          <span className="mx-2 text-slate-300">·</span>
          Plan <span className="capitalize">{data.organization.plan}</span>
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Departments</h3>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            Teams and the people in each one. Managers can move their reports.
          </p>
          <TreeList
            nodes={data.departments}
            renderNode={function (department) {
              return (
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {department.name}
                  </p>
                  <div className="mt-2 space-y-1">
                    {department.employees.length === 0 ? (
                      <p className="text-xs text-slate-400">No people assigned</p>
                    ) : (
                      department.employees.map(function (person) {
                        return (
                          <div key={person.id}>{renderPerson(person)}</div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            }}
          />
          {data.unassignedEmployees.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Company-wide
              </p>
              <div className="space-y-1">
                {data.unassignedEmployees.map(function (person) {
                  return <div key={person.id}>{renderPerson(person)}</div>;
                })}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Reporting line</h3>
          <p className="mt-1 mb-5 text-sm text-slate-500">Who reports to whom.</p>
          <TreeList
            nodes={data.reporting}
            renderNode={function (person) {
              return renderPerson(person);
            }}
          />
        </section>
      </div>
    </>
  );
}

