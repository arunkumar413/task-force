import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { Header } from "../components/Header";
export function Layout() {
  const { views } = useSelector(state => state.tasks);
  const auth = useSelector(state => state.auth);
  return <><Header /><div className="task-shell">
    <aside className="task-sidebar"><h2>Workspace</h2><Link to="/">All tasks</Link><Link to="/view/mine">My tasks</Link>
      <h2>Saved views</h2>{views.map(view => <Link key={view.id} to={"/view/" + view.id}>{view.name}</Link>)}
      <Link to="/create-view">+ Create view</Link>
    </aside><main className="task-main">
      {!auth.isLoggedin && <p className="demo-banner">Demo workspace · Sample tasks are saved in this browser. Sign in to work with your organization’s tasks.</p>}
      <Outlet />
    </main></div></>;
}
