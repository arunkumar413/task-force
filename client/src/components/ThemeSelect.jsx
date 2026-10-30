import React, { useEffect, useState } from "react";

export function ThemeSelect() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("theme") || "system"; }
    catch { return "system"; }
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme = theme === "system"
        ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    try { localStorage.setItem("theme", theme); } catch {}
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  return (
    <label className="ml-auto flex items-center gap-2 text-xs text-slate-500">
      <span className="sr-only">Color theme</span>
      <select aria-label="Color theme" className="theme-select" value={theme}
        onChange={(event) => setTheme(event.target.value)}>
        <option value="system">System theme</option>
        <option value="light">Light theme</option>
        <option value="dark">Dark theme</option>
      </select>
    </label>
  );
}

