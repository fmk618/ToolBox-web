"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ShieldCheck } from "lucide-react";

export function ToolShell({
  icon: Icon,
  title,
  description,
  local,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  /** 纯本地工具：展示"不上传"提示，消除用户对隐私的顾虑 */
  local?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
          {local && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400">
              <ShieldCheck className="h-3 w-3" />
              本地处理 · 文件与数据不会上传至任何服务器 · 仅保存在您的浏览器中
            </span>
          )}
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}

export function ToolField({
  label,
  hint,
  action,
  children,
}: {
  label: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-2">
          {hint && (
            <span className="text-[11px] text-slate-400">{hint}</span>
          )}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}
