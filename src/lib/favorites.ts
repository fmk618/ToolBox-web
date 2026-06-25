"use client";

import { useEffect, useState } from "react";

const KEY = "toolbox.favorites";
const EVENT = "toolbox.favorites.change";

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

export function toggleFavorite(slug: string): void {
  const list = read();
  write(list.includes(slug) ? list.filter((s) => s !== slug) : [slug, ...list]);
}

export function isFavorite(slug: string): boolean {
  return read().includes(slug);
}

export function useFavorites(): string[] {
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
