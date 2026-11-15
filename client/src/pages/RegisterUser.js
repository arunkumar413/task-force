import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserInfo } from "../store/authSlice";
import { apiRequest } from "../store/apiClient";
import { API_URL } from "../constants";
import { AuthButton, AuthError, AuthLayout, TextField } from "../components/AuthForm";
export function RegisterUser() {
  const [userInfo, setuserInfo] = useState({
    organizationName: "",
    topLevelDepartmentName: "Leadership",
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  function handleUserInfo(evt) {
    setuserInfo(function (prevState) {
      return {
        ...prevState,
        [evt.target.name]: evt.target.value
      };
    });
  }
  async function handleRegister(evt) {
    evt.preventDefault();
    setError("");
    if (userInfo.password !== userInfo.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      let result = await apiRequest(dispatch, "register", `${API_URL}/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userInfo)
      });
      if (!result.response.ok || !result.payload.data) {
        setError(result.payload.statusMessage || "Registration failed");
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
  return <AuthLayout title="Create your workspace" subtitle="Set up an organization and an admin account in one step." footer={<>
          Already have an account?{" "}
          <Link className="font-medium text-slate-900 underline-offset-2 hover:underline" to="/login">
            Sign in
          </Link>
        </>}>
      <form className="mt-8 flex flex-col gap-5" onSubmit={handleRegister}>
        <TextField id="organizationName" label="Organization name" name="organizationName" value={userInfo.organizationName} onChange={handleUserInfo} placeholder="Acme Inc" autoComplete="organization" hint="Used to name your workspace and generate a URL slug." />
        <TextField id="topLevelDepartmentName" label="Top-level department" name="topLevelDepartmentName" value={userInfo.topLevelDepartmentName} onChange={handleUserInfo} placeholder="Leadership" hint="Your first department. You can add child departments later." required />
        <TextField id="username" label="Username" name="username" value={userInfo.username} onChange={handleUserInfo} placeholder="jordan" autoComplete="username" required />
        <TextField id="email" label="Email" name="email" type="email" value={userInfo.email} onChange={handleUserInfo} placeholder="you@company.com" autoComplete="email" required />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField id="password" label="Password" name="password" type="password" value={userInfo.password} onChange={handleUserInfo} placeholder="Create a password" autoComplete="new-password" required />
          <TextField id="confirmPassword" label="Confirm password" name="confirmPassword" type="password" value={userInfo.confirmPassword} onChange={handleUserInfo} placeholder="Repeat password" autoComplete="new-password" required />
        </div>
        <AuthError message={error} />
        <AuthButton loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </AuthButton>
      </form>
    </AuthLayout>;
}
