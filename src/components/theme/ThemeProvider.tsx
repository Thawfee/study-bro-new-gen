"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemePref = "dark" | "light" | "system";
export type ResolvedTheme = "dark" | "light";

const STORAGE_KEY = "studybro.theme";

interface ThemeContextValue {
  theme: ThemePref;
  resolved: ResolvedTheme;
  setTheme: (t: ThemePref) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Inline script (runs before paint) to avoid a flash of the wrong theme. */
export const themeInitScript = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}')||'dark';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=p==='system'?(m?'dark':'light'):p;document.documentElement.classList.remove('dark','light');document.documentElement.classList.add(r);}catch(e){document.documentElement.classList.add('dark');}})();`;

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(resolved: ResolvedTheme) {
  const el = document.documentElement;
  el.classList.remove("dark", "light");
  el.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>("dark");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    let pref: ThemePref = "dark";
    try {
      pref = (localStorage.getItem(STORAGE_KEY) as ThemePref) || "dark";
    } catch {
      /* ignore */
    }
    setThemeState(pref);
    const r = pref === "system" ? systemTheme() : pref;
    setResolved(r);
    apply(r);
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const r = systemTheme();
      setResolved(r);
      apply(r);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
    const r = t === "system" ? systemTheme() : t;
    setResolved(r);
    apply(r);
  }, []);

  const value = useMemo(() => ({ theme, resolved, setTheme }), [theme, resolved, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
