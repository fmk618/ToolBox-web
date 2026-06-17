"use client";

import { useMemo, useState } from "react";
import yaml from "js-yaml";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

type Dir = "yaml-to-json" | "json-to-yaml";

function convert(dir: Dir, input: string): { out: string; err: string } {
  if (!input.trim()) return { out: "", err: "" };
  try {
    if (dir === "yaml-to-json") {
      const obj = yaml.load(input);
      return { out: JSON.stringify(obj, null, 2), err: "" };
    } else {
      const obj = JSON.parse(input);
      return { out: yaml.dump(obj, { indent: 2, lineWidth: 120 }), err: "" };
    }
  } catch (e) {
    return { out: "", err: e instanceof Error ? e.message : String(e) };
  }
}

const PLACEHOLDER: Record<Dir, string> = {
  "yaml-to-json": "name: toolbox\nversion: 0.1.0\ntools:\n  - base64\n  - jwt",
  "json-to-yaml": '{"name": "toolbox", "version": "0.1.0"}',
};

export default function YamlJsonUi() {
  const [dir, setDir] = useState<Dir>("yaml-to-json");
  const [input, setInput] = useState("");

  const { out, err } = useMemo(() => convert(dir, input), [dir, input]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm dark:border-slate-700 dark:bg-slate-950">
          {(["yaml-to-json", "json-to-yaml"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDir(d)}
              className={`rounded-md px-3 py-1 transition ${
                dir === d
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {d === "yaml-to-json" ? "YAML → JSON" : "JSON → YAML"}
            </button>
          ))}
        </div>

        <ToolField label={dir === "yaml-to-json" ? "YAML 输入" : "JSON 输入"}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER[dir]}
            rows={10}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            spellCheck={false}
          />
        </ToolField>

        {err ? (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {err}
          </div>
        ) : (
          <ToolField label="结果" action={<CopyButton value={out} />}>
            <textarea
              readOnly
              value={out}
              rows={10}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </ToolField>
        )}
      </div>
    </ToolShell>
  );
}
