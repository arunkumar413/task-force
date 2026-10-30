import React, { forwardRef } from "react";

export const controlClasses = "block w-full rounded-lg border border-slate-300 bg-surface px-3 py-2.5 text-sm leading-5 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60";
export const buttonClasses = "rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60";
export const primaryButtonClasses = "inline-flex items-center justify-center rounded-lg border border-transparent bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60";
export const markdownClasses = "wrap-anywhere [&_p]:my-3 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-3 [&_h1]:my-4 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:text-slate-500 [&_img]:max-w-full";
export const priorityClasses = {
  Low: "rounded-md bg-emerald-100 px-2 py-1 text-xs text-emerald-700",
  Medium: "rounded-md bg-indigo-100 px-2 py-1 text-xs text-indigo-700",
  High: "rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700",
  Urgent: "rounded-md bg-red-100 px-2 py-1 text-xs text-red-700",
};

export const Input = forwardRef(function Input({ type = "text", className, ...props }, ref) {
  if (type === "checkbox") {
    return <span className="relative inline-flex size-4.5 shrink-0 align-middle">
      <input ref={ref} type="checkbox" className={"peer m-0 size-4.5 shrink-0 cursor-pointer appearance-none rounded border border-slate-300 bg-surface accent-primary checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary disabled:cursor-not-allowed disabled:opacity-50 forced-colors:appearance-auto " + (className || "")} {...props} />
      <svg aria-hidden="true" viewBox="0 0 18 18" fill="none" className="pointer-events-none absolute inset-0 hidden size-4.5 text-white peer-checked:block peer-disabled:opacity-50 forced-colors:hidden"><path d="m4 9 3.25 3.25L14 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <svg aria-hidden="true" viewBox="0 0 18 18" className="pointer-events-none absolute inset-0 hidden size-4.5 text-white peer-indeterminate:block forced-colors:hidden"><path d="M5 9h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    </span>;
  }
  return <input ref={ref} type={type} className={(className || controlClasses) + " bg-surface text-slate-900 leading-5 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  const fullWidth = !className || className.includes("w-full");
  const nativeList = props.multiple || props.size;
  return <span className={"relative inline-grid max-w-full align-middle " + (fullWidth ? "w-full" : "")}>
    <select ref={ref} className={(className || controlClasses) + " bg-surface text-slate-900 leading-5 disabled:cursor-not-allowed disabled:opacity-60 " + (nativeList ? "" : "appearance-none pr-10 forced-colors:appearance-auto")} {...props}>{children}</select>
    {!nativeList && <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 forced-colors:hidden"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
  </span>;
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={className || controlClasses + " resize-y"} {...props} />;
});

export const Button = forwardRef(function Button({ className, ...props }, ref) {
  return <button ref={ref} className={className || buttonClasses} {...props} />;
});
