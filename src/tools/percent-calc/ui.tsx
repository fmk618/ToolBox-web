"use client";

import { useMemo, useState } from "react";
import { ErrorBox } from "../../components/tools/error-box";
import { TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { calculatePercent, percentageChange, type PercentOperation } from "./lib";
import { meta } from "./meta";

function numberValue(value: string): number { return value === "" ? 0 : Number(value); }

export default function PercentCalcUi() {
  const [amount, setAmount] = useState("100");
  const [percent, setPercent] = useState("20");
  const [from, setFrom] = useState("80");
  const [to, setTo] = useState("100");
  const [operation, setOperation] = useState<PercentOperation>("of");
  const result = useMemo(() => {
    try { return { text: calculatePercent(operation, numberValue(amount), numberValue(percent)).detail, error: "" }; }
    catch (error) { return { text: "", error: error instanceof Error ? error.message : "计算失败" }; }
  }, [amount, percent, operation]);
  const change = useMemo(() => {
    try { return { text: `${percentageChange(numberValue(from), numberValue(to)).toFixed(2)}%`, error: "" }; }
    catch (error) { return { text: "", error: error instanceof Error ? error.message : "计算失败" }; }
  }, [from, to]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">百分比与价格</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ToolField label="基数 / 原价"><TextField value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" /></ToolField>
            <ToolField label="百分比"><TextField value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="decimal" /></ToolField>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="计算方式">
            {(["of", "change", "discount", "markup"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setOperation(value)} className={`rounded-lg border px-3 py-2 text-xs transition ${operation === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                {{ of: "求百分比", change: "增加", discount: "折扣后", markup: "加价后" }[value]}
              </button>
            ))}
          </div>
          {result.error ? <ErrorBox>{result.error}</ErrorBox> : <div className="rounded-lg bg-muted/30 px-3 py-3 text-sm text-foreground">{result.text}</div>}
        </section>
        <section className="space-y-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-foreground">变化率</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ToolField label="起始值"><TextField value={from} onChange={(e) => setFrom(e.target.value)} inputMode="decimal" /></ToolField>
            <ToolField label="结束值"><TextField value={to} onChange={(e) => setTo(e.target.value)} inputMode="decimal" /></ToolField>
          </div>
          {change.error ? <ErrorBox>{change.error}</ErrorBox> : <div className="rounded-lg bg-muted/30 px-3 py-3 text-sm text-foreground">变化率：<strong>{change.text}</strong></div>}
        </section>
      </div>
      <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">仅用于通用数学计算，不构成税务、财务或投资建议。</p>
    </ToolShell>
  );
}
