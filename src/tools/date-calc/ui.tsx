"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { cn } from "../../lib/utils";
import { meta } from "./meta";
import {
  diffDates,
  formatDate,
  parseDate,
  shiftDate,
  weekdayName,
  type Unit,
} from "./lib";

type Mode = "diff" | "shift";

const UNITS: { id: Unit; label: string }[] = [
  { id: "days", label: "天" },
  { id: "weeks", label: "周" },
  { id: "months", label: "月" },
  { id: "years", label: "年" },
];

export default function DateCalcUi() {
  const [mode, setMode] = useState<Mode>("diff");

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        {/* 模式切换 */}
        <div className="flex gap-1.5">
          {(
            [
              { id: "diff", label: "日期间隔" },
              { id: "shift", label: "日期推算" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm transition-colors",
                m.id === mode
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "diff" ? <DiffMode /> : <ShiftMode />}
      </div>
    </ToolShell>
  );
}

function DiffMode() {
  const [fromStr, setFromStr] = useState("");
  const [toStr, setToStr] = useState("");

  const from = parseDate(fromStr);
  const to = parseDate(toStr);

  const result = useMemo(() => {
    if (!from || !to) return null;
    return diffDates(from, to);
  }, [from, to]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <ToolField label="起始日期" hint={from ? weekdayName(from) : undefined}>
          <input
            type="date"
            value={fromStr}
            onChange={(e) => setFromStr(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:text-foreground"
          />
        </ToolField>
        <ToolField label="结束日期" hint={to ? weekdayName(to) : undefined}>
          <input
            type="date"
            value={toStr}
            onChange={(e) => setToStr(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:text-foreground"
          />
        </ToolField>
      </div>

      {result ? (
        <>
          <div className="rounded-xl border border-foreground/30 bg-accent p-4 text-center">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              相隔
            </div>
            <div className="mt-1 font-mono text-3xl font-semibold text-foreground">
              {Math.abs(result.totalDays).toLocaleString("zh-CN")}
              <span className="ml-1 text-base font-normal text-muted-foreground">天</span>
            </div>
            {result.totalDays < 0 && (
              <div className="mt-0.5 text-xs text-muted-foreground">
                （结束日期早于起始日期）
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat
              label="年 / 月 / 天"
              value={`${result.years}年${result.months}月${result.days}天`}
            />
            <Stat label="完整周数" value={`${result.weeks} 周`} />
            <Stat
              label="工作日"
              value={`${result.workdays.toLocaleString("zh-CN")} 天`}
            />
            <Stat
              label="总天数"
              value={Math.abs(result.totalDays).toLocaleString("zh-CN")}
            />
          </div>
        </>
      ) : (
        <Hint text="选择起始与结束日期以计算间隔" />
      )}
    </div>
  );
}

function ShiftMode() {
  const [baseStr, setBaseStr] = useState("");
  const [amountStr, setAmountStr] = useState("100");
  const [unit, setUnit] = useState<Unit>("days");
  const [sign, setSign] = useState<1 | -1>(1);

  const base = parseDate(baseStr);
  const amount = Number(amountStr);

  const result = useMemo(() => {
    if (!base || !Number.isFinite(amount)) return null;
    return shiftDate(base, sign * Math.round(amount), unit);
  }, [base, amount, sign, unit]);

  const out = result ? formatDate(result) : "";

  return (
    <div className="space-y-4">
      <ToolField label="基准日期" hint={base ? weekdayName(base) : undefined}>
        <input
          type="date"
          value={baseStr}
          onChange={(e) => setBaseStr(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:text-foreground"
        />
      </ToolField>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex rounded-md border border-border p-0.5">
          {(
            [
              { v: 1 as const, label: "之后 +" },
              { v: -1 as const, label: "之前 −" },
            ]
          ).map((s) => (
            <button
              key={s.v}
              onClick={() => setSign(s.v)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                s.v === sign
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <input
          value={amountStr}
          onChange={(e) => setAmountStr(e.target.value)}
          type="number"
          step="1"
          className="w-24 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-sm dark:text-foreground"
          aria-label="数量"
        />

        <div className="flex rounded-md border border-border p-0.5">
          {UNITS.map((u) => (
            <button
              key={u.id}
              onClick={() => setUnit(u.id)}
              className={cn(
                "rounded px-3 py-1.5 text-sm transition-colors",
                u.id === unit
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      {result ? (
        <div className="rounded-xl border border-foreground/30 bg-accent p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              结果日期
            </span>
            <CopyButton value={out} />
          </div>
          <div className="mt-1 font-mono text-3xl font-semibold text-foreground">
            {out}
          </div>
          <div className="mt-0.5 text-sm text-muted-foreground">
            {weekdayName(result)}
          </div>
        </div>
      ) : (
        <Hint text="选择基准日期以推算" />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
