"use client";

import { useMemo, useState } from "react";
import { diffChars, diffLines } from "diff";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";

type Mode = "line" | "char";

export default function TextDiffUi() {
  const [a, setA] = useState("Hello world\nThis is the original line.\nKeep me.");
  const [b, setB] = useState(
    "Hello world!\nThis is the EDITED line.\nKeep me.",
  );
  const [mode, setMode] = useState<Mode>("line");

  const parts = useMemo(
    () => (mode === "line" ? diffLines(a, b) : diffChars(a, b)),
    [a, b, mode],
  );

  const stats = useMemo(() => {
    let add = 0,
      del = 0;
    parts.forEach((p) => {
      if (p.added) add += p.value.length;
      else if (p.removed) del += p.value.length;
    });
    return { add, del };
  }, [parts]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm dark:border-slate-700 dark:bg-slate-950">
            {(["line", "char"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 transition ${
                  mode === m
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {m === "line" ? "按行" : "按字符"}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs">
            <span className="text-green-600">+{stats.add}</span>{" "}
            <span className="text-red-600">−{stats.del}</span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ToolField label="原文">
            <textarea
              value={a}
              onChange={(e) => setA(e.target.value)}
              rows={10}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </ToolField>
          <ToolField label="新文">
            <textarea
              value={b}
              onChange={(e) => setB(e.target.value)}
              rows={10}
              spellCheck={false}
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </ToolField>
        </div>

        <ToolField label="差异">
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 font-mono text-xs leading-6 dark:border-slate-700 dark:bg-slate-950">
            {parts.map((p, i) => {
              if (p.added)
                return (
                  <span
                    key={i}
                    className="bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-200"
                  >
                    {p.value}
                  </span>
                );
              if (p.removed)
                return (
                  <span
                    key={i}
                    className="bg-red-100 text-red-800 line-through dark:bg-red-950/60 dark:text-red-200"
                  >
                    {p.value}
                  </span>
                );
              return (
                <span key={i} className="text-slate-700 dark:text-slate-300">
                  {p.value}
                </span>
              );
            })}
          </pre>
        </ToolField>
      </div>
    </ToolShell>
  );
}
