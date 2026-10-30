import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { API_URL } from "../constants";
import { apiRequest } from "../store/apiClient";

export function ChangePassword({ email }) {
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const dispatch = useDispatch();

  function handleChange(evt) {
    const { name, value } = evt.target;
    setForm(function (prev) {
      return { ...prev, [name]: value };
    });
  }

  async function requestCode() {
    setSending(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(dispatch, "requestPasswordOtp", `${API_URL}/profile/password/otp`, {
        method: "POST",
        credentials: "include",
      });
      if (!result.response.ok) {
        setError(result.payload.statusMessage || "Unable to send code.");
        return;
      }
      setOtpSent(true);
      setOtpMessage(result.payload.statusMessage || "A code was sent to your email.");
    } catch (err) {
      setError("Unable to send code.");
    } finally {
      setSending(false);
    }
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest(dispatch, "changePassword", `${API_URL}/profile/password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!result.response.ok) {
        setError(result.payload.statusMessage || "Unable to change password.");
        return;
      }
      setNotice(result.payload.statusMessage || "Password updated.");
      setForm({ otp: "", password: "", confirmPassword: "" });
      setOtpSent(false);
      setOtpMessage("");
    } catch (err) {
      setError("Unable to change password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mb-10 rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Change password</h2>
      <p className="mt-1 mb-5 text-sm text-slate-500">
        We send a 6-digit code to {email || "your email"}. Enter it with your
        new password.
      </p>

      {notice && (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {otpMessage && (
        <p className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {otpMessage}
        </p>
      )}

      <div className="mb-4">
        <button
          type="button"
          disabled={sending}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          onClick={requestCode}
        >
          {sending ? "Sending…" : otpSent ? "Resend code" : "Send code"}
        </button>
      </div>

      <form className="grid max-w-md gap-4" onSubmit={handleSubmit}>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Verification code</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 tracking-widest text-slate-900"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={form.otp}
            onChange={handleChange}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">New password</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Confirm password</span>
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-fit rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
      </form>
    </section>
  );
}

