"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { ToolShell } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Select } from "../../components/tools/select";
import { cn } from "../../lib/utils";
import { meta } from "./meta";
import { CATEGORY_LABEL, computeRetirement, type Category } from "./lib";

type Gender = "male" | "female";
type FemaleClass = "55" | "50";

const YEAR_OPTS = Array.from({ length: 2010 - 1945 + 1 }, (_, i) => {
  const y = 1945 + i;
  return { value: String(y), label: `${y} 年` };
});
const MONTH_OPTS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} 月`,
}));

function fmtAge(years: number, months: number): string {
  return months > 0 ? `${years} 周岁 ${months} 个月` : `${years} 周岁`;
}

function delayText(months: number): string {
  if (months <= 0) return "未触发延迟";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y && m) return `延迟 ${y} 年 ${m} 个月`;
  if (y) return `延迟 ${y} 年`;
  return `延迟 ${m} 个月`;
}

export default function PensionCalcUi() {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [femaleClass, setFemaleClass] = useState<FemaleClass>("55");

  const category: Category =
    gender === "male" ? "man" : femaleClass === "55" ? "woman55" : "woman50";

  const result = useMemo(() => {
    if (!year || !month) return null;
    return computeRetirement(Number(year), Number(month), category);
  }, [year, month, category]);

  const retireStr = result
    ? `${result.retireYear} 年 ${result.retireMonth} 月`
    : "";

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        {/* ── 输入 ── */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="出生年月">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={year}
                  onChange={setYear}
                  options={YEAR_OPTS}
                  placeholder="年份"
                  ariaLabel="出生年份"
                />
                <Select
                  value={month}
                  onChange={setMonth}
                  options={MONTH_OPTS}
                  placeholder="月份"
                  ariaLabel="出生月份"
                />
              </div>
            </Field>

            <Field label="性别">
              <Segmented
                value={gender}
                onChange={(v) => setGender(v as Gender)}
                options={[
                  { value: "male", label: "男" },
                  { value: "female", label: "女" },
                ]}
              />
            </Field>
          </div>

          {gender === "female" && (
            <Field
              label="原法定退休年龄"
              hint="干部 / 管理 / 技术岗为 55 岁，工人岗为 50 岁"
              className="mt-4"
            >
              <Segmented
                value={femaleClass}
                onChange={(v) => setFemaleClass(v as FemaleClass)}
                options={[
                  { value: "55", label: "55 岁 · 管理/技术岗" },
                  { value: "50", label: "50 岁 · 工人岗" },
                ]}
              />
            </Field>
          )}
        </div>

        {result ? (
          <div className="space-y-4">
            {/* ── 主结果 ── */}
            <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-accent p-6 text-center">
              <div className="absolute right-3 top-3">
                <CopyButton value={retireStr} />
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                预计退休时间
              </div>
              <div className="mt-2 flex items-baseline justify-center gap-1 font-mono">
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  {result.retireYear}
                </span>
                <span className="text-xl text-muted-foreground">年</span>
                <span className="text-5xl font-bold tracking-tight text-foreground">
                  {result.retireMonth}
                </span>
                <span className="text-xl text-muted-foreground">月</span>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {CATEGORY_LABEL[result.category]} · 法定退休年龄{" "}
                <span className="font-semibold text-foreground">
                  {fmtAge(result.newAgeYears, result.newAgeMonths)}
                </span>
              </div>
            </div>

            {/* ── 年龄对比条 ── */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="shrink-0 text-center">
                  <div className="text-xl font-semibold text-muted-foreground">
                    {result.originalAge}
                    <span className="ml-0.5 text-xs font-normal">岁</span>
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    原法定
                  </div>
                </div>

                <div className="relative min-w-0 flex-1">
                  <div className="h-[3px] w-full rounded-full bg-gradient-to-r from-border to-foreground/70" />
                  <ChevronRight className="absolute -right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/70" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground shadow-sm">
                    {delayText(result.delayMonths)}
                  </div>
                </div>

                <div className="shrink-0 text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {result.newAgeYears}
                    <span className="ml-0.5 text-xs font-normal">
                      岁{result.newAgeMonths > 0 ? `${result.newAgeMonths}月` : ""}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    法定退休
                  </div>
                </div>
              </div>
            </div>

            {/* ── 次要指标 ── */}
            <div className="grid grid-cols-3 gap-2.5">
              <Stat
                label="延迟"
                value={
                  result.delayMonths > 0 ? `${result.delayMonths} 个月` : "—"
                }
              />
              <Stat
                label="最低缴费年限"
                value={`${result.minContributionYears} 年`}
              />
              <Stat
                label="弹性区间"
                value={`${result.elasticEarliest.years}–${result.elasticLatest.years} 岁`}
              />
            </div>

            {result.unaffected && (
              <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
                您在改革施行（2025 年 1 月）前已达到原法定退休年龄{" "}
                {result.originalAge} 岁，不受延迟退休政策影响。
              </div>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              依据国务院《渐进式延迟法定退休年龄的办法》（国发〔2024〕18
              号），2025-01-01 起施行，按出生年月所属批次推算，精确到「年-月」。
              「弹性区间」指可在不早于原法定年龄的前提下最多提前 3
              年、或经协商最多延后 3 年。特殊工种、因病提前退休及个人实际情况另行规定，本结果仅供参考。
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-3 py-10 text-center text-sm text-muted-foreground">
            选择出生年月与性别 / 岗位，推算法定退休时间
          </div>
        )}
      </div>
    </ToolShell>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex w-full rounded-lg border border-border bg-muted/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors",
            o.value === value
              ? "bg-background font-medium text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
