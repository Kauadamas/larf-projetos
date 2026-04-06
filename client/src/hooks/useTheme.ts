import { useState, useEffect } from "react";

type Theme = "dark" | "light";

function getInitial(): Theme {
  try {
    const saved = localStorage.getItem("larf_theme") as Theme;
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === "light") {
    html.classList.add("light");
  } else {
    html.classList.remove("light");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitial);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Apply on mount (before first render flicker)
  useEffect(() => {
    applyTheme(getInitial());
  }, []);

  function setTheme(t: Theme) {
    localStorage.setItem("larf_theme", t);
    setThemeState(t);
    applyTheme(t);
  }

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return { theme, toggle, setTheme };
}
