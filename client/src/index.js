import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch, useSelector } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { appStore } from "./store/appStore";
import { AppRouter } from "./AppRouter";
import { API_URL } from "./constants";
import { logout, setUserInfo } from "./store/authSlice";
import { loadTasks, persistDemo, resetTasks } from "./store/tasksFilterSlice";
import "./index.css";

persistDemo(appStore);
function Bootstrap() {
  const dispatch = useDispatch();
  const auth = useSelector(state => state.auth);
  useEffect(() => {
    fetch(API_URL + "/me", { credentials: "include" })
      .then(async response => {
        if (!response.ok) { localStorage.removeItem("userInfo"); dispatch(logout()); return; }
        const payload = await response.json();
        dispatch(setUserInfo(payload.data));
      }).catch(() => dispatch(logout()));
  }, [dispatch]);
  useEffect(() => {
    if (auth.checked) { dispatch(resetTasks()); dispatch(loadTasks()); }
  }, [auth.checked, auth.isLoggedin, auth.id, dispatch]);
  if (!auth.checked) return <p className="p-6">Loading Task Force…</p>;
  return <RouterProvider router={AppRouter} />;
}
createRoot(document.getElementById("app")).render(
  <Provider store={appStore}>
    <div className="min-h-screen bg-slate-50 font-sans leading-relaxed text-slate-700 antialiased [&_button:not(:disabled)]:cursor-pointer [&_select:not(:disabled)]:cursor-pointer **:focus-visible:outline-2 **:focus-visible:outline-offset-2 **:focus-visible:outline-primary **:motion-reduce:transition-none">
      <Bootstrap />
    </div>
  </Provider>
);
