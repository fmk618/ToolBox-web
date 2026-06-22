"use client";

import { ArrowRightLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { CATEGORIES, convert } from "./lib";
import { cn } from "../../lib/utils";

export default function UnitConvertUi() {
  const [catId, setCatId] = useState(CATEGORIES[0].id);
  const cat = CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[0];

  const [fromUnit, setFromUnit] = useState(cat.units[0].id);
  const [toUnit, setToUnit] = useState(cat.units[1]?.id ?? cat.units[0].id);
  const [valueStr, setValueStr] = useState("1");

  // When category changes, reset both units to first two of the new category
  function switchCat(nextId: string) {
    const c = CATEGORIES.find((x) => x.id === nextId);
    if (!c) return;
    setCatId(nextId);
    setFromUnit(c.units[0].id);
    setToUnit(c.units[1]?.id ?? c.units[0].id);
  }

  const value = Number(valueStr);
  const out = useMemo(() => {
    if (!Number.isFinite(value)) return "";
    const r = convert(cat, fromUnit, toUnit, value);
    return r === null ? "" : String(r);
  }, [cat, fromUnit, toUnit, value]);

  function swap() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setValueStr(out || "1");
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        {/* Category tabs */}
        <div className="-mx-1 flex flex-wrap gap-1.5 overflow-x-auto px-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => switchCat(c.id)}
              className={cn(
                "shrink-0 rounded-md border px-3 py-1 text-xs transition-colors",
                c.id === catId
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          {/* From */}
          <div className="space-y-2">
            <ToolField label="从">
              <input
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                type="number"
                step="any"
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-lg dark:text-foreground"
              />
            </ToolField>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              {cat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Swap */}
          <button
            onClick={swap}
            className="grid h-10 w-10 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:self-end"
            aria-label="交换"
            title="交换"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          {/* To */}
          <div className="space-y-2">
            <ToolField label="到" action={<CopyButton value={out} />}>
              <input
                readOnly
                value={out}
                placeholder="—"
                className="w-full rounded-md border border-border bg-muted px-3 py-2 font-mono text-lg"
              />
            </ToolField>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              {cat.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick reference: convert 1 of `from` to all other units */}
        {valueStr === "1" && (
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              1 {cat.units.find((u) => u.id === fromUnit)?.label} =
            </div>
            <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
              {cat.units
                .filter((u) => u.id !== fromUnit)
                .map((u) => {
                  const v = convert(cat, fromUnit, u.id, 1);
                  return (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-2 border-b border-border/40 py-1 last:border-0"
                    >
                      <span className="text-muted-foreground">{u.label}</span>
                      <span className="font-mono text-foreground">{v}</span>
                    </li>
                  );
                })}
            </ul>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
