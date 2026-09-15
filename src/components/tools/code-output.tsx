"use client";

import type { ReactNode } from "react";
import { CopyButton } from "./copy-button";
import { ErrorBox } from "./error-box";

export type CodeOutputBackground = keyof typeof CODE_OUTPUT_BACKGROUNDS;

export const CODE_OUTPUT_BACKGROUNDS = {
  light: {
    label: "浅色",
    background: "#f8fafc",
    foreground: "#0f172a",
    border: "#64748b",
    gutter: "#475569",
  },
  dark: {
    label: "深色",
    background: "#111827",
    foreground: "#f9fafb",
    border: "#9ca3af",
    gutter: "#d1d5db",
  },
  blue: {
    label: "深蓝",
    background: "#172554",
    foreground: "#dbeafe",
    border: "#60a5fa",
    gutter: "#93c5fd",
  },
  purple: {
    label: "紫色",
    background: "#2e1065",
    foreground: "#ede9fe",
    border: "#a78bfa",
    gutter: "#c4b5fd",
  },
  highContrast: {
    label: "高对比度",
    background: "#ffffff",
    foreground: "#000000",
    border: "#000000",
    gutter: "#000000",
  },
} as const;

const BACKGROUND_OPTIONS: readonly { value: CodeOutputBackground; label: string }[] = [
  { value: "light", label: "浅色" },
  { value: "dark", label: "深色" },
  { value: "blue", label: "深蓝" },
  { value: "purple", label: "紫色" },
];

export function CodeOutput({
  label,
  value,
  background,
  onBackgroundChange,
  error,
  extraAction,
  placeholder = "暂无结果",
}: {
  label: string;
  value: string;
  background: CodeOutputBackground;
  onBackgroundChange: (background: CodeOutputBackground) => void;
  error?: string | null;
  extraAction?: ReactNode;
  placeholder?: string;
}) {
  const colors = CODE_OUTPUT_BACKGROUNDS[background];
  const lines = value ? value.split("\n") : [];

  return (
    <section className="code-output space-y-2" aria-label={label}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <div className="truncate text-sm font-medium text-foreground">{label}</div>
          <div className="shrink-0 text-[11px] text-muted-foreground">
            {value ? `${lines.length.toLocaleString("zh-CN")} 行 · ${value.length.toLocaleString("zh-CN")} 字` : "等待格式化"}
          </div>
        </div>
        <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1.5">
          <span className="sr-only">背景</span>
          <div className="flex items-center gap-1" role="group" aria-label="背景颜色">
            {BACKGROUND_OPTIONS.map((option) => {
              const optionColors = CODE_OUTPUT_BACKGROUNDS[option.value];
              const selected = option.value === background;
              return (
                <button
                  key={option.value}
                  type="button"
                  title={option.label}
                  aria-label={`${option.label}背景`}
                  aria-pressed={selected}
                  onClick={() => onBackgroundChange(option.value)}
                  className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${selected ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
                  style={{ backgroundColor: optionColors.background, borderColor: optionColors.border }}
                />
              );
            })}
          </div>
          {extraAction}
          <CopyButton value={value} />
        </div>
      </div>

      {error ? (
        <ErrorBox>{error}</ErrorBox>
      ) : (
        <div
          className="code-output-surface min-h-[24rem] max-h-[42rem] min-w-0 overflow-auto rounded-xl border"
          style={{ backgroundColor: colors.background, borderColor: colors.border }}
        >
          <div className="flex min-h-full min-w-max">
            <div
              aria-hidden="true"
              className="code-output-gutter sticky left-0 z-10 shrink-0 select-none border-r px-3 py-3 text-right font-mono text-xs leading-6"
              style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.gutter }}
            >
              {lines.length ? lines.map((_, index) => <div key={index}>{index + 1}</div>) : <div>—</div>}
            </div>
            <pre
              aria-label={`${label}内容`}
              className="code-output-content m-0 min-w-max flex-1 whitespace-pre px-4 py-3 font-mono text-sm leading-6 [font-variant-ligatures:none]"
              style={{ color: colors.foreground }}
            >
              {value || placeholder}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
