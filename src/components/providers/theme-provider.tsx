"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// ─────────────────────────────────────────────────────────────
// Thème sombre premium par défaut, option claire. Source de
// vérité = classe .dark sur <html> (posée côté serveur, ajustée
// avant peinture par un script inline). Abonnement via un mini
// store externe (pattern useSyncExternalStore, sans effet).
// ─────────────────────────────────────────────────────────────

type Theme = "dark" | "light";

const listeners = new Set<() => void>();

function subscribeTheme(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function setThemeValue(next: Theme) {
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    window.localStorage.setItem("rk-theme", next);
  } catch {}
  for (const l of listeners) l();
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: "dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "dark" as Theme);
  const toggle = () => setThemeValue(theme === "dark" ? "light" : "dark");
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
