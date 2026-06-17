"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

function generate(count: number): string[] {
  return Array.from({ length: count }, () => crypto.randomUUID());
}

export default function UuidUi() {
  const [count, setCount] = useState(8);
  const [list, setList] = useState<string[]>(() => generate(8));

  const joined = list.join("\n");

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <ToolField label="数量">
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.max(1, Math.min(500, parseInt(e.target.value) || 1)),
                )
              }
              className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </ToolField>
          <button
            onClick={() => setList(generate(count))}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" /> 重新生成
          </button>
        </div>
        <ToolField
          label={`已生成 ${list.length} 个`}
          action={<CopyButton value={joined} />}
        >
          <textarea
            readOnly
            value={joined}
            rows={12}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </ToolField>
      </div>
    </ToolShell>
  );
}
