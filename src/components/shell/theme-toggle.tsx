"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "toolbox.theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "light") root.classList.add("light");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function cycle() {
    const next: Theme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "暗色" : theme === "light" ? "亮色" : "跟随系统";

  return (
    <button
      onClick={cycle}
      title={`当前：${label} — 点击切换`}
      className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`主题：${label}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
