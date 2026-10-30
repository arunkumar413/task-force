import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { clearApiResponses } from "../store/apiSlice";
import { ThemeSelect } from "./ThemeSelect";
import { API_URL } from "../constants";
export function Header() {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  async function signOut() {
    try {
      const response = await fetch(API_URL + "/logout", { method: "POST", credentials: "include" });
      if (!response.ok) throw new Error("Unable to sign out");
      localStorage.removeItem("userInfo");
      dispatch(clearApiResponses());
      dispatch(logout());
    } catch (err) { setError(err.message); }
  }
  return <header className="border-b border-slate-200 bg-surface">
    <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4">
      <Link className="font-semibold text-slate-900" to="/">Task Force</Link>
      <Link to="/add-new-task">New task</Link><Link to="/create-view">Create view</Link>
      {auth.isLoggedin ? <><Link to="/profile">Profile & organization</Link><span className="text-sm text-slate-500">{auth.email}</span><button onClick={signOut}>Sign out</button></> :
        <><Link to="/login">Sign in</Link><Link to="/register">Create organization</Link></>}
      <ThemeSelect />
      {error && <p role="alert">{error}</p>}
    </nav>
  </header>;
}
