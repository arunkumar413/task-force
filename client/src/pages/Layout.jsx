import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { Header } from "../components/Header";
import { ThemeSelect } from "../components/ThemeSelect";
export function Layout() {
  const {
    views
  } = useSelector(state => state.tasks);
  const auth = useSelector(state => state.auth);
  return <><Header /><div className="mx-auto grid min-h-[85vh] max-w-7xl md:grid-cols-[210px_minmax(0,1fr)]">
    <aside className="flex flex-wrap gap-1.5 border-b border-slate-200 px-5 py-3 md:block md:border-r md:border-b-0 md:py-8 [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:hidden [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:tracking-widest [&_h2]:text-slate-500 [&_h2]:uppercase md:[&_h2]:block [&_a]:block [&_a]:rounded-md [&_a]:px-2.5 [&_a]:py-2 [&_a:hover]:bg-slate-100"><h2 className="mb-3.5 text-lg font-semibold tracking-tight text-slate-900">Workspace</h2><Link to="/">All tasks</Link><Link to="/view/mine">My tasks</Link>
      <h2 className="mb-3.5 text-lg font-semibold tracking-tight text-slate-900">Saved views</h2>{views.map(view => <Link key={view.id} to={"/view/" + view.id}>{view.name}</Link>)}
      <Link to="/create-view">+ Create view</Link>
    </aside>
    
    <main className="min-w-0 p-4 md:p-7">
      {!auth.isLoggedin && <p className="mb-6 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600" data-testid="demo-banner">Demo workspace · Sample tasks are saved in this browser. Sign in to work with your organization’s tasks.</p>}
      <Outlet />
    </main></div></>;
}
