"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Button } from "../../components/tools/button";
import { TextField } from "../../components/tools/inputs";
import { meta } from "./meta";

function generateUuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function generate(count: number): string[] {
  return Array.from({ length: count }, generateUuid);
}

export default function UuidUi() {
  const [count, setCount] = useState(8);
  const [list, setList] = useState<string[]>(() => generate(8));

  const joined = list.join("\n");

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <ToolField label="数量">
            <TextField
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.max(1, Math.min(500, parseInt(e.target.value) || 1)),
                )
              }
              className="w-24 py-1.5"
            />
          </ToolField>
          <Button onClick={() => setList(generate(count))}>
            <RefreshCw className="h-4 w-4" /> 重新生成
          </Button>
        </div>
        <ToolField
          label={`已生成 ${list.length} 个`}
          action={<CopyButton value={joined} />}
        >
          <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-border bg-muted/30 p-2 sm:p-3">
            <div className="space-y-2">
              {list.map((value, index) => (
                <div
                  key={`${value}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 shadow-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs leading-6 text-foreground">
                    {value}
                  </code>
                  <CopyButton value={value} />
                </div>
              ))}
            </div>
          </div>
        </ToolField>
      </div>
    </ToolShell>
  );
}
