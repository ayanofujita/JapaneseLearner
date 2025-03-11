import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === "dark" || (theme === "system" && getSystemTheme() === "dark");

    root.classList.remove("light", "dark");
    root.classList.add(isDark ? "dark" : "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return { theme, setTheme };
}
