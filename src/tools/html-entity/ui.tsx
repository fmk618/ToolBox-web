"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

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
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm dark:border-slate-700 dark:bg-slate-950">
          {(["encode", "decode"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 transition ${
                mode === m
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {m === "encode" ? "转义" : "反转义"}
            </button>
          ))}
        </div>
        <ToolField label="输入">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? '<a href="x">点击 & 看看</a>'
                : "&lt;a href=&quot;x&quot;&gt;点击 &amp; 看看&lt;/a&gt;"
            }
            rows={6}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </ToolField>
        <ToolField label="结果" action={<CopyButton value={output} />}>
          <textarea
            readOnly
            value={output}
            rows={6}
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </ToolField>
      </div>
    </ToolShell>
  );
}
