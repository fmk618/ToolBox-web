"use client";

import { useState } from "react";
import { ToolShell } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

const BASES = [
  { label: "二进制", short: "BIN", base: 2,  prefix: "0b" },
  { label: "八进制", short: "OCT", base: 8,  prefix: "0o" },
  { label: "十进制", short: "DEC", base: 10, prefix: ""   },
  { label: "十六进制", short: "HEX", base: 16, prefix: "0x" },
];

function parse(input: string, base: number): bigint | null {
  const s = input.trim().replace(/^(0x|0b|0o)/i, "");
  if (!s) return null;
  try {
    const n = BigInt("0x" + BigInt(base === 16 ? `0x${s}` : `${s}`).toString(16));
    // validate all chars are valid for this base
    const valid = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, base);
    if (![...s.toLowerCase()].every((c) => valid.includes(c))) return null;
    return BigInt(parseInt(s, base));
  } catch {
    return null;
  }
}

export default function BaseConvertUi() {
  const [input, setInput] = useState("255");
  const [srcBase, setSrcBase] = useState(10);

  const n = (() => {
    const s = input.trim().replace(/^(0x|0b|0o)/i, "");
    if (!s) return null;
    const valid = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, srcBase);
    if (![...s.toLowerCase()].every((c) => valid.includes(c))) return null;
    const v = parseInt(s, srcBase);
    return isNaN(v) ? null : v;
  })();

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">输入数值</div>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-sm focus:border-ring focus:bg-background focus:outline-none"
            placeholder="输入数值…"
            spellCheck={false}
          />
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">源进制</div>
          <div className="flex gap-2">
            {BASES.map((b) => (
              <button
                key={b.base}
                onClick={() => setSrcBase(b.base)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  srcBase === b.base
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {b.short}
              </button>
            ))}
          </div>
        </div>

        {input && n === null && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            「{input}」不是合法的 {BASES.find((b) => b.base === srcBase)?.label}数
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {BASES.map((b) => {
            const raw = n !== null ? n.toString(b.base).toUpperCase() : "";
            const display = raw ? `${b.prefix}${raw}` : "—";
            const isSource = srcBase === b.base;
            return (
              <div
                key={b.base}
                className={`rounded-lg border p-3 ${
                  isSource
                    ? "border-foreground/30 bg-foreground/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {b.label} ({b.base})
                  </span>
                  {raw && <CopyButton value={raw} />}
                </div>
                <div className="break-all font-mono text-sm leading-relaxed">
                  {display}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToolShell>
  );
}
