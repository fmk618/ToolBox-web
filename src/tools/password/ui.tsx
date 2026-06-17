"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import {
  estimateBits,
  generatePassword,
  strengthLabel,
  type CharSet,
} from "./lib";

const ALL_SETS: { id: CharSet; label: string }[] = [
  { id: "lower", label: "小写 a-z" },
  { id: "upper", label: "大写 A-Z" },
  { id: "digit", label: "数字 0-9" },
  { id: "symbol", label: "符号 !@#…" },
];

export default function PasswordUi() {
  const [length, setLength] = useState(20);
  const [sets, setSets] = useState<Set<CharSet>>(
    () => new Set<CharSet>(["lower", "upper", "digit", "symbol"]),
  );
  const [exclude, setExclude] = useState(true);
  const [seed, setSeed] = useState(0);

  const password = useMemo(
    () =>
      generatePassword({
        length,
        sets,
        excludeAmbiguous: exclude,
      }),
    // include seed so refresh button regenerates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [length, sets, exclude, seed],
  );

  const bits = estimateBits(length, sets, exclude);
  const strength = strengthLabel(bits);

  function toggleSet(id: CharSet) {
    setSets((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <ToolField label="生成结果" action={<CopyButton value={password} />}>
          <div className="flex items-stretch gap-2">
            <input
              readOnly
              value={password}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-base tracking-wider dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              换一个
            </button>
          </div>
        </ToolField>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              强度
            </span>
            <span className="text-xs text-slate-500">
              约 {bits} bit · {strength.label}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`${strength.color} h-full transition-all`}
              style={{ width: `${Math.min(100, (bits / 140) * 100)}%` }}
            />
          </div>
        </div>

        <ToolField label="长度" hint={`${length} 位`}>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full"
          />
        </ToolField>

        <ToolField label="字符集">
          <div className="flex flex-wrap gap-1.5">
            {ALL_SETS.map(({ id, label }) => {
              const on = sets.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleSet(id)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    on
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : "border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </ToolField>

        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={exclude}
            onChange={(e) => setExclude(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          排除易混淆字符（O 0 I l 1 | ` ' ")
        </label>
      </div>
    </ToolShell>
  );
}
