import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../constants";
import { useDispatch } from "react-redux";
import { apiRequest } from "../store/apiClient";
import {
  AuthButton,
  AuthError,
  AuthLayout,
  TextField,
} from "../components/AuthForm";

export function AcceptInvite() {
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
    organizationSlug: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  function handleChange(evt) {
    const { name, value } = evt.target;
    setForm(function (prev) {
      return { ...prev, [name]: value };
    });
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const result = await apiRequest(dispatch, "acceptInvite", `${API_URL}/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!result.response.ok) {
        setError(result.payload.statusMessage || "Unable to accept invite.");
        return;
      }
      setNotice(result.payload.statusMessage || "Password saved.");
      setTimeout(function () {
        navigate("/login");
      }, 800);
    } catch (err) {
      setError("Unable to reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Accept invite"
      subtitle="Enter the code from your invite email and choose a password."
      footer={
        <>
          Already set a password?{" "}
          <Link
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
            to="/login"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit}>
        <TextField
          id="email"
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <TextField
          id="otp"
          label="Invite code"
          name="otp"
          value={form.otp}
          onChange={handleChange}
          placeholder="6-digit code"
          autoComplete="one-time-code"
          required
        />
        <TextField
          id="password"
          label="New password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
        />
        <TextField
          id="confirmPassword"
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat password"
          autoComplete="new-password"
          required
        />
        <TextField
          id="organizationSlug"
          label="Organization slug"
          name="organizationSlug"
          value={form.organizationSlug}
          onChange={handleChange}
          placeholder="acme"
          hint="Needed only if your email belongs to more than one organization."
        />
        {notice && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {notice}
          </p>
        )}
        <AuthError message={error} />
        <AuthButton loading={loading}>
          {loading ? "Saving…" : "Set password"}
        </AuthButton>
      </form>
    </AuthLayout>
  );
}

