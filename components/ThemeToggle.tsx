"use client";

import { useEffect, useState } from "react";
import { ThemePreference, applyTheme, loadThemePreference, saveThemePreference } from "@/lib/theme";

export default function ThemeToggle() {
  const [pref, setPref] = useState<ThemePreference | null>(null);

  useEffect(() => {
    setPref(loadThemePreference());

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (loadThemePreference() === "system") applyTheme("system");
    };
    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  if (!pref) return null;

  const handleChange = (next: ThemePreference) => {
    setPref(next);
    saveThemePreference(next);
    applyTheme(next);
  };

  return (
    <select
      value={pref}
      onChange={(e) => handleChange(e.target.value as ThemePreference)}
      aria-label="テーマ設定"
      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
    >
      <option value="light">ライト</option>
      <option value="dark">ダーク</option>
      <option value="system">デバイスに合わせる</option>
    </select>
  );
}
