"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Segmented } from "../../components/tools/segmented";
import { TextArea } from "../../components/tools/inputs";
import { meta } from "./meta";

const MODE_OPTIONS = [
  { value: "encode", label: "转义" },
  { value: "decode", label: "反转义" },
] as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unescapeHtml(s: string): string {
  const doc = new DOMParser().parseFromString(s, "text/html");
  return doc.documentElement.textContent ?? "";
}

export default function HtmlEntityUi() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return "";
    return mode === "encode" ? escapeHtml(input) : unescapeHtml(input);
  }, [input, mode]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <Segmented<"encode" | "decode">
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
        />
        <ToolField label="输入">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? '<a href="x">点击 & 看看</a>'
                : "&lt;a href=&quot;x&quot;&gt;点击 &amp; 看看&lt;/a&gt;"
            }
            rows={6}
            className="resize-y"
          />
        </ToolField>
        <ToolField label="结果" action={<CopyButton value={output} />}>
          <TextArea
            readOnly
            value={output}
            rows={6}
            className="resize-y bg-muted"
          />
        </ToolField>
      </div>
    </ToolShell>
  );
}
