"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeKey =
  | "dark"
  | "midnight"
  | "terminal"
  | "sunset"
  | "figma"
  | "claude"
  | "forest";

export type ThemeEntry = {
  key: ThemeKey;
  label: string;
  group: "dark" | "light";
  bg: string;
  accent: string;
};

export const THEMES: ThemeEntry[] = [
  { key: "dark",     label: "Dark",     group: "dark",  bg: "#20212c", accent: "#635fc7" },
  { key: "midnight", label: "Midnight", group: "dark",  bg: "#080c18", accent: "#4f8ef7" },
  { key: "terminal", label: "Terminal", group: "dark",  bg: "#0a0a0a", accent: "#00e676" },
  { key: "sunset",   label: "Sunset",   group: "light", bg: "#fff8f0", accent: "#f97316" },
  { key: "figma",    label: "Figma",    group: "light", bg: "#f0f0f0", accent: "#7c3aed" },
  { key: "claude",   label: "Claude",   group: "light", bg: "#faf9f7", accent: "#d4682d" },
  { key: "forest",   label: "Forest",   group: "light", bg: "#f0f5f1", accent: "#2d6a4f" },
];

const VALID_KEYS = new Set<string>(THEMES.map((t) => t.key));

function isThemeKey(value: string): value is ThemeKey {
  return VALID_KEYS.has(value);
}

type ThemeContextValue = {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  themes: ThemeEntry[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("aragon-theme");
    if (stored && isThemeKey(stored)) {
      setThemeState(stored);
      document.documentElement.dataset.theme = stored;
    }
  }, []);

  function setTheme(next: ThemeKey) {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("aragon-theme", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
