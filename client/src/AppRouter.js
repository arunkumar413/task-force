import * as React from "react";
import { createBrowserRouter } from "react-router-dom";
import { ContactPage } from "./pages/ContactPage";
import { AboutPage } from "./pages/AboutPage";
import { TaskPage } from "./pages/TaskPage";
import { CreateNewTaskPage } from "./pages/CreateNewTaskPage";
import { EditTaskPage } from "./pages/EditTaskPage";

import { LoginPage } from "./pages/Login";
import { RegisterUser } from "./pages/RegisterUser";
import { Layout } from "./pages/Layout";
import App from "./pages/App";
import { ViewPage } from "./pages/ViewPage";

export const AppRouter = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <App />,
      },
      {
        path: "/contact",
        element: <ContactPage />,
      },
      {
        path: "/about",
        element: <AboutPage />,
      },
      {
        path: "/login",
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterUser />,
      },
      {
        path: "/task/:task_id",
        element: <TaskPage />,
      },
      {
        path: "/add-new-task",
        element: <CreateNewTaskPage />,
      },
      {
        path: "/task/:task_id/edit",
        element: <EditTaskPage />,
      },
      {
        path: "/view/:viewId",
        element: <ViewPage />,
      },
    ],
  },
]);
