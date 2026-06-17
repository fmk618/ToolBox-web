"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";
import { hexToRgb } from "../color/lib";

function relativeLuminance(r: number, g: number, b: number): number {
  const chan = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(...fg);
  const l2 = relativeLuminance(...bg);
  const [lo, hi] = l1 < l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export default function ColorContrastUi() {
  const [fg, setFg] = useState("#1f2937");
  const [bg, setBg] = useState("#ffffff");

  const result = useMemo(() => {
    const fgRgb = hexToRgb(fg);
    const bgRgb = hexToRgb(bg);
    if (!fgRgb || !bgRgb) return null;
    const ratio = contrastRatio(fgRgb, bgRgb);
    return {
      ratio: ratio.toFixed(2),
      normalAA: ratio >= 4.5,
      normalAAA: ratio >= 7,
      largeAA: ratio >= 3,
      largeAAA: ratio >= 4.5,
    };
  }, [fg, bg]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolField label="前景色">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
              />
              <input
                value={fg}
                onChange={(e) => setFg(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </ToolField>
          <ToolField label="背景色">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-slate-200 dark:border-slate-700"
              />
              <input
                value={bg}
                onChange={(e) => setBg(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </ToolField>
        </div>

        <div
          className="rounded-xl border border-slate-200 px-4 py-6 dark:border-slate-700"
          style={{ background: bg, color: fg }}
        >
          <div className="text-3xl font-semibold">敏捷的棕色狐狸跳过懒狗</div>
          <div className="mt-1 text-sm">
            The quick brown fox jumps over the lazy dog
          </div>
          <div className="mt-3 text-xs opacity-80">
            正文示例 / sample body text
          </div>
        </div>

        {result ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs text-slate-500">对比度</div>
              <div className="mt-1 text-4xl font-bold text-slate-900 dark:text-slate-50">
                {result.ratio} : 1
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Row label="正文 AA (≥4.5)" pass={result.normalAA} />
              <Row label="正文 AAA (≥7)" pass={result.normalAAA} />
              <Row label="大字 AA (≥3)" pass={result.largeAA} />
              <Row label="大字 AAA (≥4.5)" pass={result.largeAAA} />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            请输入合法的 Hex 颜色
          </div>
        )}
      </div>
    </ToolShell>
  );
}

function Row({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
        pass
          ? "border-green-300 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200"
          : "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      }`}
    >
      <span>{label}</span>
      <span className="font-medium">{pass ? "✓ 通过" : "✗ 不通过"}</span>
    </div>
  );
}
