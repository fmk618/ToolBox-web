"use client";

import { useEffect, useState } from "react";

function readLocalValue<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? initial : (JSON.parse(raw) as T);
  } catch {
    return initial;
  }
}

/**
 * SSR 安全的 localStorage 输入持久化。
 *
 * 首次在客户端读取已存值并在后续改动时写回。纯本地工具用它保存输入
 * 状态，刷新不丢。key 约定：`toolbox.tool.<slug>.<field>`。
 */
export function useLocalState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readLocalValue(key, initial));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota exceeded — silently ignore */
    }
  }, [key, value]);

  return [value, setValue];
}
