"use client";

/**
 * Theme = token remap: dark ("Bunker") is the default on :root, light
 * ("Daylight Patrol") is the `light` class on <html>. Components never use
 * `dark:` variants, so all this does is stamp the class and remember it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { THEME_STORAGE_KEY } from "./theme-script";

export { THEME_INIT_SCRIPT, THEME_STORAGE_KEY } from "./theme-script";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggle(): void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(next: Theme): void {
  document.documentElement.classList.toggle("light", next === "light");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Storage blocked: theme still applies for this session.
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR renders "dark"; the mount effect syncs with whatever the init script
  // already stamped on <html> before paint.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (document.documentElement.classList.contains("light")) {
      setTheme("light");
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      // Side effect is idempotent per `next`, safe under StrictMode replays.
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): { theme: Theme; toggle(): void } {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error(
      "useTheme() must be used inside <ThemeProvider> — wrap your app in it (see src/app/layout.tsx).",
    );
  }
  return ctx;
}
