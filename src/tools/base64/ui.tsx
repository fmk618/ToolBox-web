"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

function encode(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return "";
  }
}

function decode(
  text: string,
): { ok: true; value: string } | { ok: false; err: string } {
  try {
    return { ok: true, value: decodeURIComponent(escape(atob(text.trim()))) };
  } catch (e) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

export default function Base64Ui() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return { value: "", err: "" };
    if (mode === "encode") return { value: encode(input), err: "" };
    const r = decode(input);
    return r.ok
      ? { value: r.value, err: "" }
      : { value: "", err: "不是有效的 Base64" };
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
              {m === "encode" ? "编码" : "解码"}
            </button>
          ))}
        </div>
        <ToolField label={mode === "encode" ? "输入文本" : "输入 Base64"}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? "Hello, world" : "SGVsbG8sIHdvcmxk"}
            rows={6}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </ToolField>
        <ToolField label="结果" action={<CopyButton value={output.value} />}>
          {output.err ? (
            <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {output.err}
            </div>
          ) : (
            <textarea
              readOnly
              value={output.value}
              rows={6}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          )}
        </ToolField>
      </div>
    </ToolShell>
  );
}
