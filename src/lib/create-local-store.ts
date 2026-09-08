"use client";

import { useEffect, useState } from "react";

/**
 * localStorage 存储工厂 — favorites / recents / history / llm-config 的公共实现。
 *
 * 读写带 SSR 守卫与 quota 容错；写入后广播 `${key}.change` 事件，
 * `useValue()` 同时监听该事件与跨标签页的 storage 事件。
 */
export function createLocalStore<T>(key: string, options?: { max?: number }) {
  const EVENT = `${key}.change`;

  function read(): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  function write(value: T): void {
    if (typeof window === "undefined") return;
    try {
      const persisted =
        options?.max != null && Array.isArray(value)
          ? (value as unknown[]).slice(0, options.max)
          : value;
      localStorage.setItem(key, JSON.stringify(persisted));
      window.dispatchEvent(new CustomEvent(EVENT));
    } catch {
      /* quota exceeded — silently ignore */
    }
  }

  function remove(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent(EVENT));
    } catch {
      /* ignore */
    }
  }

  function useValue(): T | null {
    const [value, setValue] = useState<T | null>(null);
    useEffect(() => {
      setValue(read());
      const handler = () => setValue(read());
      window.addEventListener(EVENT, handler);
      window.addEventListener("storage", handler);
      return () => {
        window.removeEventListener(EVENT, handler);
        window.removeEventListener("storage", handler);
      };
    }, []);
    return value;
  }

  return { read, write, remove, useValue };
}
