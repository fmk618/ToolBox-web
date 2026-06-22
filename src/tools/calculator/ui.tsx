"use client";

import { Delete } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ToolShell } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { evaluate } from "./lib";
import { cn } from "../../lib/utils";

const KEYS: { label: string; kind: "num" | "op" | "act" | "eq" }[][] = [
  [
    { label: "AC", kind: "act" },
    { label: "⌫", kind: "act" },
    { label: "%", kind: "op" },
    { label: "÷", kind: "op" },
  ],
  [
    { label: "7", kind: "num" },
    { label: "8", kind: "num" },
    { label: "9", kind: "num" },
    { label: "×", kind: "op" },
  ],
  [
    { label: "4", kind: "num" },
    { label: "5", kind: "num" },
    { label: "6", kind: "num" },
    { label: "−", kind: "op" },
  ],
  [
    { label: "1", kind: "num" },
    { label: "2", kind: "num" },
    { label: "3", kind: "num" },
    { label: "+", kind: "op" },
  ],
  [
    { label: "(", kind: "op" },
    { label: "0", kind: "num" },
    { label: ".", kind: "num" },
    { label: ")", kind: "op" },
  ],
];

export default function CalculatorUi() {
  const [expr, setExpr] = useState("");
  const [history, setHistory] = useState<{ expr: string; value: string }[]>([]);

  const live = useMemo(() => evaluate(expr), [expr]);
  const liveStr = live === null ? "" : String(live);

  const press = useCallback(
    (label: string) => {
      if (label === "AC") {
        setExpr("");
        return;
      }
      if (label === "⌫") {
        setExpr((e) => e.slice(0, -1));
        return;
      }
      if (label === "=") {
        if (live === null || !expr) return;
        setHistory((h) => [{ expr, value: String(live) }, ...h].slice(0, 6));
        setExpr(String(live));
        return;
      }
      setExpr((e) => e + label);
    },
    [expr, live],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (/^[0-9+\-*/.()%]$/.test(e.key)) {
        e.preventDefault();
        const map: Record<string, string> = { "*": "×", "/": "÷", "-": "−" };
        press(map[e.key] ?? e.key);
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        press("=");
      } else if (e.key === "Backspace") {
        e.preventDefault();
        press("⌫");
      } else if (e.key === "Escape") {
        e.preventDefault();
        press("AC");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-3">
          {/* Display */}
          <div className="rounded-xl border border-border bg-card p-4 text-card-foreground">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                表达式
              </span>
              <CopyButton value={liveStr} />
            </div>
            <div className="break-all text-right font-mono text-lg text-foreground">
              {expr || <span className="text-muted-foreground">0</span>}
            </div>
            <div className="mt-2 text-right text-2xl font-semibold tabular-nums">
              {liveStr || (
                <span className="text-muted-foreground">=</span>
              )}
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-2">
            {KEYS.flat().map((k) => (
              <button
                key={k.label}
                onClick={() => press(k.label)}
                className={cn(
                  "rounded-md border border-border py-3 text-base font-medium transition-colors",
                  k.kind === "num" && "bg-card hover:bg-accent",
                  k.kind === "op" && "bg-muted hover:bg-accent",
                  k.kind === "act" && "bg-muted/50 text-muted-foreground hover:bg-accent",
                )}
              >
                {k.label === "⌫" ? (
                  <Delete className="mx-auto h-4 w-4" />
                ) : (
                  k.label
                )}
              </button>
            ))}
            <button
              onClick={() => press("=")}
              className="col-span-4 rounded-md bg-foreground py-3 text-base font-semibold text-background transition-opacity hover:opacity-90"
            >
              =
            </button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground">
            支持键盘输入：数字、<code>+ − × ÷ ( ) %</code>、Enter 计算、Esc 清空
          </p>
        </div>

        {/* History */}
        <aside className="rounded-xl border border-border bg-card p-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            历史
          </div>
          {history.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              尚无计算
            </div>
          ) : (
            <ul className="space-y-2 text-xs">
              {history.map((h, i) => (
                <li
                  key={i}
                  className="cursor-pointer rounded-md border border-transparent p-2 hover:border-border hover:bg-accent"
                  onClick={() => setExpr(h.expr)}
                  title="点击恢复表达式"
                >
                  <div className="truncate font-mono text-muted-foreground">
                    {h.expr}
                  </div>
                  <div className="truncate text-right font-mono font-semibold text-foreground">
                    = {h.value}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </ToolShell>
  );
}
