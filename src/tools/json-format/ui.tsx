"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

export default function JsonFormatUi() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<2 | 4>(2);

  const result = useMemo(() => {
    if (!input.trim()) return { pretty: "", minified: "", err: "" };
    try {
      const parsed: unknown = JSON.parse(input);
      return {
        pretty: JSON.stringify(parsed, null, indent),
        minified: JSON.stringify(parsed),
        err: "",
      };
    } catch (e) {
      return {
        pretty: "",
        minified: "",
        err: e instanceof Error ? e.message : String(e),
      };
    }
  }, [input, indent]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <ToolField label="输入 JSON">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"hello":"world"}'
            rows={8}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            spellCheck={false}
          />
        </ToolField>

        {result.err ? (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {result.err}
          </div>
        ) : (
          <>
            <ToolField
              label="美化输出"
              action={
                <>
                  <div className="inline-flex rounded-md border border-slate-200 bg-white text-[11px] dark:border-slate-700 dark:bg-slate-900">
                    {([2, 4] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() => setIndent(n)}
                        className={`px-2 py-0.5 ${
                          indent === n
                            ? "bg-blue-600 text-white"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {n} 空格
                      </button>
                    ))}
                  </div>
                  <CopyButton value={result.pretty} />
                </>
              }
            >
              <textarea
                readOnly
                value={result.pretty}
                rows={10}
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </ToolField>
            <ToolField
              label="压缩"
              action={<CopyButton value={result.minified} />}
            >
              <textarea
                readOnly
                value={result.minified}
                rows={3}
                className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </ToolField>
          </>
        )}
      </div>
    </ToolShell>
  );
}
