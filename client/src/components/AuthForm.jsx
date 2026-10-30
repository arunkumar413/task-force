import React from "react";
import { Header } from "./Header";

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="flex justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
            )}
            {children}
          </div>
          {footer && (
            <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
          )}
        </div>
      </main>
    </div>
  );
}

export function TextField({
  id,
  label,
  hint,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required ? "" : (
          <span className="ml-1 font-normal text-slate-400">(optional)</span>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-surface px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
      {hint && <p className="text-xs leading-5 text-slate-400">{hint}</p>}
    </div>
  );
}

export function AuthButton({ children, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

