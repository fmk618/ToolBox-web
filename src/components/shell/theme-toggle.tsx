"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "toolbox.theme";
const CHANGE_EVENT = "toolbox.theme.change";

function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

function subscribeTheme(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  if (theme === "dark") root.classList.add("dark");
  else if (theme === "light") root.classList.add("light");
}

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, readTheme, () => "system");

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function cycle() {
    const next: Theme = theme === "system" ? "dark" : theme === "dark" ? "light" : "system";
    saveTheme(next);
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
