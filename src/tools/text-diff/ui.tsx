"use client";

import { useMemo, useState } from "react";
import { diffChars, diffLines } from "diff";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { Segmented } from "../../components/tools/segmented";
import { TextArea } from "../../components/tools/inputs";
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
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[{ value: "line", label: "按行" }, { value: "char", label: "按字符" }]}
          />
          <div className="ml-auto text-xs">
            <span className="text-green-600">+{stats.add}</span>{" "}
            <span className="text-red-600">−{stats.del}</span>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <ToolField label="原文">
            <TextArea
              value={a}
              onChange={(e) => setA(e.target.value)}
              rows={10}
              spellCheck={false}
              className="resize-y text-xs"
            />
          </ToolField>
          <ToolField label="新文">
            <TextArea
              value={b}
              onChange={(e) => setB(e.target.value)}
              rows={10}
              spellCheck={false}
              className="resize-y text-xs"
            />
          </ToolField>
        </div>

        <ToolField label="差异">
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-xs leading-6">
            {parts.map((p, i) => {
              if (p.added)
                return (
                  <span
                    key={i}
                    className="bg-green-500/10 text-green-700 dark:text-green-300"
                  >
                    {p.value}
                  </span>
                );
              if (p.removed)
                return (
                  <span
                    key={i}
                    className="bg-destructive/10 text-destructive line-through"
                  >
                    {p.value}
                  </span>
                );
              return (
                <span key={i} className="text-foreground">
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
