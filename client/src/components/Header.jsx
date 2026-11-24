import { Button } from "./FormControls";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { clearApiResponses } from "../store/apiSlice";
import { Notifications } from "./Notifications";
import { ThemeSelect } from "./ThemeSelect";
import { API_URL } from "../constants";
export function Header() {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [error, setError] = useState("");
  async function signOut() {
    try {
      const response = await fetch(API_URL + "/logout", {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) throw new Error("Unable to sign out");
      localStorage.removeItem("userInfo");
      dispatch(clearApiResponses());
      dispatch(logout());
    } catch (err) {
      setError(err.message);
    }
  }
  return <header className="border-b border-slate-200 bg-surface">
    <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4">
      <Link className="font-semibold text-slate-900 hover:bg-blue-200 py-1 px-1 rounded" to="/">Task Force</Link>
      <Link className="hover:bg-blue-200 p-1 rounded" to="/add-new-task">New task</Link>
      <Link className="hover:bg-blue-200 p-1 rounded" to="/create-view">Create view</Link>
            {auth.isLoggedin ? <> 
            <Link className="hover:bg-blue-200 p-1 rounded" to="/profile">Profile & organization</Link><span className="text-sm text-slate-500">{auth.email}</span>
            <Notifications className="ml-auto" key={auth.id} />
            <Button className="hover:bg-blue-200 p-1 rounded" onClick={signOut}>Sign out</Button>
            </> : <>
            <Link className="hover:bg-blue-200 p-1 rounded" to="/login">Sign in</Link><Link className="hover:bg-blue-200 p-1 rounded"  to="/register">Create organization</Link></>}
            <ThemeSelect className="ml-auto" />


      {error && <p role="alert" className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </nav>
  </header>;
}
