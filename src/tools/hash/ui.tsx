"use client";

import { useEffect, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { TextField, TextArea } from "../../components/tools/inputs";
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
    if (!input) return;
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

  const visibleResults = input ? results : EMPTY;

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <ToolField label="输入文本">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="任意文本…"
            rows={4}
            className="resize-y"
          />
        </ToolField>
        <div className="space-y-3">
          {HASH_ALGORITHMS.map((a) => (
            <ToolField key={a} label={a} action={<CopyButton value={visibleResults[a]} />}>
              <TextField
                readOnly
                value={visibleResults[a]}
                placeholder="—"
                className="truncate bg-muted py-1.5 font-mono text-xs"
              />
            </ToolField>
          ))}
        </div>
      </div>
    </ToolShell>
  );
}
