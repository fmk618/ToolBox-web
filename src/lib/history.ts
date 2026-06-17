"use client";

import { useEffect, useState } from "react";

const KEY = "toolbox.history";
const MAX = 50;

export type HistoryEntry = {
  srcName: string;
  srcFmt: string;
  dstFmt: string;
  size: number;
  at: number;
};

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(list: HistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("toolbox.history.change"));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

export function addHistory(entry: HistoryEntry) {
  const list = read();
  list.unshift(entry);
  write(list);
}

export function clearHistory() {
  write([]);
}

export function useHistory(): HistoryEntry[] {
  const [list, setList] = useState<HistoryEntry[]>([]);
  useEffect(() => {
    setList(read());
    const handler = () => setList(read());
    window.addEventListener("toolbox.history.change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("toolbox.history.change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return list;
}
