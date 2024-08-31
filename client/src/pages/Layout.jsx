import React from "react";
import { Link, Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";

export function Layout() {
  return (
    <div className="Layout">
      <Header />
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
