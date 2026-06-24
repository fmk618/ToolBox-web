"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { cn } from "../../lib/utils";
import { meta } from "./meta";
import {
  calcLoan,
  fmtMoney,
  type RepayMethod,
} from "./lib";

const METHODS: { id: RepayMethod; label: string; hint: string }[] = [
  { id: "equal-installment", label: "等额本息", hint: "每月还款固定" },
  { id: "equal-principal", label: "等额本金", hint: "月供递减、总利息更少" },
];

// 常见期限快捷选项（年）
const TERM_PRESETS = [1, 3, 5, 10, 20, 30];

export default function LoanCalcUi() {
  const [amountStr, setAmountStr] = useState("1000000");
  const [rateStr, setRateStr] = useState("4.9");
  const [years, setYears] = useState(30);
  const [method, setMethod] = useState<RepayMethod>("equal-installment");
  const [showAll, setShowAll] = useState(false);

  const result = useMemo(() => {
    return calcLoan({
      principal: Number(amountStr),
      annualRatePct: Number(rateStr),
      months: years * 12,
      method,
    });
  }, [amountStr, rateStr, years, method]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        {/* 输入区 */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ToolField label="贷款总额（元）">
            <input
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              type="number"
              min={0}
              step="any"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-lg dark:text-foreground"
            />
          </ToolField>

          <ToolField label="年利率（%）">
            <input
              value={rateStr}
              onChange={(e) => setRateStr(e.target.value)}
              type="number"
              min={0}
              step="any"
              className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-lg dark:text-foreground"
            />
          </ToolField>
        </div>

        {/* 期限 */}
        <ToolField label="贷款期限" hint={`${years} 年 · ${years * 12} 期`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {TERM_PRESETS.map((y) => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={cn(
                  "rounded-md border px-3 py-1 text-xs transition-colors",
                  y === years
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {y} 年
              </button>
            ))}
            <input
              value={years}
              onChange={(e) => setYears(Math.max(1, Math.round(Number(e.target.value) || 0)))}
              type="number"
              min={1}
              max={40}
              className="w-20 rounded-md border border-input bg-background px-2 py-1 font-mono text-sm dark:text-foreground"
              aria-label="自定义年限"
            />
          </div>
        </ToolField>

        {/* 还款方式 */}
        <ToolField label="还款方式">
          <div className="grid gap-2 sm:grid-cols-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-colors",
                  m.id === method
                    ? "border-foreground bg-accent"
                    : "border-border hover:bg-muted/50",
                )}
              >
                <div className="text-sm font-medium text-foreground">{m.label}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{m.hint}</div>
              </button>
            ))}
          </div>
        </ToolField>

        {/* 结果区 */}
        {result ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat
                label={method === "equal-principal" ? "首月月供" : "每月月供"}
                value={`¥ ${fmtMoney(result.firstPayment)}`}
                sub={
                  method === "equal-principal"
                    ? `末月降至 ¥ ${fmtMoney(result.lastPayment)}`
                    : undefined
                }
                accent
              />
              <Stat label="总利息" value={`¥ ${fmtMoney(result.totalInterest)}`} />
              <Stat label="还款总额" value={`¥ ${fmtMoney(result.totalPayment)}`} />
            </div>

            {/* 还款计划表 */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                  还款计划 · 共 {result.schedule.length} 期
                </span>
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  {showAll ? "仅看前 12 期" : "展开全部"}
                </button>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr className="text-muted-foreground">
                      <th className="px-3 py-2 text-left font-medium">期数</th>
                      <th className="px-3 py-2 text-right font-medium">月供</th>
                      <th className="px-3 py-2 text-right font-medium">本金</th>
                      <th className="px-3 py-2 text-right font-medium">利息</th>
                      <th className="px-3 py-2 text-right font-medium">剩余本金</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {(showAll ? result.schedule : result.schedule.slice(0, 12)).map(
                      (row) => (
                        <tr
                          key={row.period}
                          className="border-t border-border/40 last:border-b-0"
                        >
                          <td className="px-3 py-1.5 text-left">{row.period}</td>
                          <td className="px-3 py-1.5 text-right">{fmtMoney(row.payment)}</td>
                          <td className="px-3 py-1.5 text-right">{fmtMoney(row.principal)}</td>
                          <td className="px-3 py-1.5 text-right text-muted-foreground">
                            {fmtMoney(row.interest)}
                          </td>
                          <td className="px-3 py-1.5 text-right">{fmtMoney(row.balance)}</td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
            请输入有效的贷款金额、利率与期限
          </div>
        )}
      </div>
    </ToolShell>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        accent ? "border-foreground/30 bg-accent" : "border-border bg-card",
      )}
    >
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-lg font-semibold text-foreground">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}
