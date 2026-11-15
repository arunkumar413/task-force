import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./pages/Layout";
import App from "./pages/App";
import { CreateNewTaskPage } from "./pages/CreateNewTaskPage";
import { EditTaskPage } from "./pages/EditTaskPage";
import { CreateViewPage } from "./pages/CreateViewPage";
import { AboutPage } from "./pages/AboutPage";
import { ContactPage } from "./pages/ContactPage";
import { RequireAuth } from "./components/RequireAuth";
import { GuestOnly } from "./components/GuestOnly";
export const AppRouter = createBrowserRouter([
  { element: <Layout />, children: [
    { path: "/", element: <App /> },
    { path: "/task/:task_id", lazy: async () => ({ Component: (await import("./pages/TaskPage")).TaskPage }) },
    { path: "/add-new-task", element: <CreateNewTaskPage /> },
    { path: "/task/:task_id/edit", element: <EditTaskPage /> },
    { path: "/view/:viewId", element: <App /> },
    { path: "/create-view", element: <CreateViewPage /> },
    { path: "/about", element: <AboutPage /> },
    { path: "/contact", element: <ContactPage /> },
  ] },
  { path: "/login", lazy: async () => { const { LoginPage } = await import("./pages/Login"); return { Component: () => <GuestOnly><LoginPage /></GuestOnly> }; } },
  { path: "/register", lazy: async () => { const { RegisterUser } = await import("./pages/RegisterUser.js"); return { Component: () => <GuestOnly><RegisterUser /></GuestOnly> }; } },
  { path: "/invite", lazy: async () => { const { AcceptInvite } = await import("./pages/AcceptInvite"); return { Component: () => <GuestOnly><AcceptInvite /></GuestOnly> }; } },
  { path: "/profile", lazy: async () => { const { ProfilePage } = await import("./pages/ProfilePage"); return { Component: () => <RequireAuth><ProfilePage /></RequireAuth> }; } },
  { element: <Layout />, children: [{ path: "*", element: <p>Page not found. <a href="/">Back to tasks</a></p> }] },
]);
