"use client";

import { useEffect, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { HASH_ALGORITHMS, hashText, type HashAlgo } from "./lib";

const EMPTY: Record<HashAlgo, string> = {
  "SHA-1": "",
  "SHA-256": "",
  "SHA-384": "",
  "SHA-512": "",
};

export default function HashUi() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<Record<HashAlgo, string>>(EMPTY);

  useEffect(() => {
    if (!input) {
      setResults(EMPTY);
      return;
    }
    let alive = true;
    Promise.all(HASH_ALGORITHMS.map((a) => hashText(a, input))).then((vals) => {
      if (!alive) return;
      const next = { ...EMPTY };
      HASH_ALGORITHMS.forEach((a, i) => (next[a] = vals[i]));
      setResults(next);
    });
    return () => {
      alive = false;
    };
  }, [input]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <ToolField label="输入文本">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="任意文本…"
            rows={4}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </ToolField>
        <div className="space-y-3">
          {HASH_ALGORITHMS.map((a) => (
            <ToolField key={a} label={a} action={<CopyButton value={results[a]} />}>
              <input
                readOnly
                value={results[a]}
                placeholder="—"
                className="w-full truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </ToolField>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
