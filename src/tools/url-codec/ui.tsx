"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

export default function UrlCodecUi() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return { value: "", err: "" };
    try {
      const v =
        mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
      return { value: v, err: "" };
    } catch (e) {
      return { value: "", err: e instanceof Error ? e.message : String(e) };
    }
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

        <ToolField label="输入">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "hello world & 你好"
                : "hello%20world%20%26%20%E4%BD%A0%E5%A5%BD"
            }
            rows={5}
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
              rows={5}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          )}
        </ToolField>
      </div>
    </ToolShell>
  );
}
