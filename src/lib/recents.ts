"use client";

import { useEffect, useState } from "react";

const KEY = "toolbox.recents";
const EVENT = "toolbox.recents.change";
const MAX = 8;

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(slugs: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* quota exceeded */
  }
}

export function pushRecent(slug: string): void {
  const list = read().filter((s) => s !== slug);
  write([slug, ...list].slice(0, MAX));
}

export function useRecents(): string[] {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    setList(read());
    const handler = () => setList(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return list;
}
