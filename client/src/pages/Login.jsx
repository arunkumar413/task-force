import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../store/authSlice";
import { apiRequest } from "../store/apiClient";
import { API_URL } from "../constants";
import { AuthButton, AuthError, AuthLayout, TextField } from "../components/AuthForm";
export function LoginPage() {
  const [userCred, setUserCred] = useState({
    email: "",
    password: "",
    organizationSlug: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  async function handleLogin(evt) {
    evt.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result = await apiRequest(dispatch, "login", `${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userCred)
      });
      if (!result.response.ok || !result.payload.data) {
        setError(result.payload.statusMessage || "Login failed");
        return;
      }
      localStorage.setItem("userInfo", JSON.stringify(result.payload.data));
      dispatch(setUserInfo(result.payload.data));
      navigate("/");
    } catch (err) {
      setError("Unable to reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }
  function handleUserCred(evt) {
    setUserCred(function (prevState) {
      return {
        ...prevState,
        [evt.target.name]: evt.target.value
      };
    });
  }
  return <AuthLayout title="Welcome back" subtitle="Sign in with your work email to continue." footer={<>
          Don&apos;t have an account?{" "}
          <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/register">
            Create one
          </Link>
          {" · "}
          <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/invite">
            Accept invite
          </Link>
        </>}>
      <form className="mt-8 flex flex-col gap-5" onSubmit={handleLogin}>
        <TextField id="email" label="Email" name="email" type="email" value={userCred.email} onChange={handleUserCred} placeholder="you@company.com" autoComplete="email" required />
        <TextField id="password" label="Password" name="password" type="password" value={userCred.password} onChange={handleUserCred} placeholder="Enter your password" autoComplete="current-password" required />
        <TextField id="organizationSlug" label="Organization slug" name="organizationSlug" type="text" value={userCred.organizationSlug} onChange={handleUserCred} placeholder="acme" autoComplete="organization" hint="Needed only if your email belongs to more than one organization." />
        <AuthError message={error} />
        <AuthButton loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </AuthButton>
      </form>
    </AuthLayout>;
}
