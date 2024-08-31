import React, { StrictMode } from "react";
import ReactDOM from "react-dom";
import { App } from "./pages/Home";
import * as ReactDOMClient from "react-dom/client";
import { AppRouter } from "./AppRouter";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { appStore } from "./store/appStore";

const el = document.getElementById("app");

const container = document.getElementById("app");

const root = ReactDOMClient.createRoot(container);

root.render(
  <StrictMode>
    <Provider store={appStore}>
      <RouterProvider router={AppRouter} />
    </Provider>
  </StrictMode>
);

// ReactDOM.render(<App />, el);
