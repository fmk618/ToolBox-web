"use client";

import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/utils";

const focus =
  "focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

/** 多行输入。mono 默认开 — 工具输入以代码/数据为主。 */
export function TextArea({
  className,
  mono = true,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { mono?: boolean }) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60",
        mono && "font-mono",
        "disabled:cursor-not-allowed disabled:opacity-50",
        focus,
        className,
      )}
    />
  );
}

export function TextField({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        focus,
        className,
      )}
    />
  );
}
