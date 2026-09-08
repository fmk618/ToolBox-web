"use client";

import type { ReactNode } from "react";

/** 错误提示框 — 工具内统一的内联错误展示（role=alert 便于读屏）。 */
export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </div>
  );
}
