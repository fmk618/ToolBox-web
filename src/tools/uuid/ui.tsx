"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Button } from "../../components/tools/button";
import { TextField, TextArea } from "../../components/tools/inputs";
import { meta } from "./meta";

function generate(count: number): string[] {
  return Array.from({ length: count }, () => crypto.randomUUID());
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
          <TextArea
            readOnly
            value={joined}
            rows={12}
            className="resize-y bg-muted text-xs"
          />
        </ToolField>
      </div>
    </ToolShell>
  );
}
