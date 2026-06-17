"use client";

import { useMemo, useState } from "react";
import cronstrue from "cronstrue/i18n";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";

const PRESETS: { label: string; expr: string }[] = [
  { label: "每分钟", expr: "* * * * *" },
  { label: "每小时整点", expr: "0 * * * *" },
  { label: "每天 9:00", expr: "0 9 * * *" },
  { label: "每周一 18:00", expr: "0 18 * * 1" },
  { label: "每月 1 号 0:00", expr: "0 0 1 * *" },
  { label: "工作日 8:30", expr: "30 8 * * 1-5" },
];

/** Compute next N firings using a brute-force minute walker.
 * Supports standard 5-field cron: m h dom mon dow.
 * Handles `*`, comma lists, ranges `a-b`, and steps `/n`.
 */
function parseField(expr: string, min: number, max: number): number[] | null {
  const out = new Set<number>();
  for (const part of expr.split(",")) {
    let step = 1;
    let body = part;
    const sIdx = part.indexOf("/");
    if (sIdx >= 0) {
      step = Number(part.slice(sIdx + 1));
      body = part.slice(0, sIdx);
      if (!Number.isInteger(step) || step <= 0) return null;
    }
    let lo: number, hi: number;
    if (body === "*") {
      lo = min;
      hi = max;
    } else if (body.includes("-")) {
      const [a, b] = body.split("-").map(Number);
      lo = a;
      hi = b;
    } else {
      lo = hi = Number(body);
    }
    if (!Number.isInteger(lo) || !Number.isInteger(hi)) return null;
    if (lo < min || hi > max || lo > hi) return null;
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return [...out].sort((a, b) => a - b);
}

function nextFirings(expr: string, from: Date, count: number): Date[] | null {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) return null;
  const m = parseField(fields[0], 0, 59);
  const h = parseField(fields[1], 0, 23);
  const dom = parseField(fields[2], 1, 31);
  const mon = parseField(fields[3], 1, 12);
  const dow = parseField(fields[4], 0, 6);
  if (!m || !h || !dom || !mon || !dow) return null;

  const out: Date[] = [];
  const start = new Date(from);
  start.setSeconds(0, 0);
  start.setMinutes(start.getMinutes() + 1);

  const cur = new Date(start);
  const limitMs = 366 * 24 * 60 * 60 * 1000; // 1 year scan
  const stop = +start + limitMs;
  while (out.length < count && +cur < stop) {
    if (
      mon.includes(cur.getMonth() + 1) &&
      dom.includes(cur.getDate()) &&
      dow.includes(cur.getDay()) &&
      h.includes(cur.getHours()) &&
      m.includes(cur.getMinutes())
    ) {
      out.push(new Date(cur));
    }
    cur.setMinutes(cur.getMinutes() + 1);
  }
  return out;
}

export default function CronParseUi() {
  const [expr, setExpr] = useState("0 9 * * 1-5");

  const explain = useMemo(() => {
    try {
      return cronstrue.toString(expr, { locale: "zh_CN" });
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, [expr]);

  const isValid = !explain.startsWith("Error");
  const firings = useMemo(
    () => (isValid ? nextFirings(expr, new Date(), 5) : null),
    [expr, isValid],
  );

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <ToolField label="Cron 表达式（5 字段：分 时 日 月 周）">
          <input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="0 9 * * 1-5"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-base dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            spellCheck={false}
          />
        </ToolField>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setExpr(p.expr)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          className={`rounded-xl border px-4 py-3 ${
            isValid
              ? "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          <div className="text-xs font-medium opacity-80">含义</div>
          <div className="mt-0.5 text-sm">{explain}</div>
        </div>

        {firings && firings.length > 0 && (
          <ToolField label="接下来 5 次触发">
            <div className="space-y-1 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950">
              {firings.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-slate-100 py-1.5 text-xs last:border-0 dark:border-slate-800"
                >
                  <span className="text-slate-400">#{i + 1}</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {d.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </ToolField>
        )}
      </div>
    </ToolShell>
  );
}
