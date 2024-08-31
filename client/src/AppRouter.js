import * as React from "react";
import { createBrowserRouter } from "react-router-dom";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Home } from "./pages/Home";
import { LoginPage } from "./pages/Login";
import { RegisterUser } from "./pages/RegisterUser";

export const AppRouter = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterUser />,
  },
]);
