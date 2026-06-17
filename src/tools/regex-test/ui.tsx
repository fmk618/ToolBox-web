"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";

const FLAG_OPTIONS = [
  { f: "g", label: "全局 g" },
  { f: "i", label: "忽略大小写 i" },
  { f: "m", label: "多行 m" },
  { f: "s", label: "dotAll s" },
  { f: "u", label: "Unicode u" },
] as const;

type Match = {
  text: string;
  index: number;
  length: number;
  groups: string[];
  named: Record<string, string>;
};

function runRegex(
  pattern: string,
  flags: string,
  input: string,
): { matches: Match[]; err: string } {
  if (!pattern) return { matches: [], err: "" };
  try {
    const re = new RegExp(pattern, flags);
    if (!flags.includes("g")) {
      const m = re.exec(input);
      if (!m) return { matches: [], err: "" };
      return { matches: [toMatch(m)], err: "" };
    }
    const out: Match[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      out.push(toMatch(m));
      if (m.index === re.lastIndex) re.lastIndex++;
      if (out.length > 1000) break;
    }
    return { matches: out, err: "" };
  } catch (e) {
    return { matches: [], err: e instanceof Error ? e.message : String(e) };
  }
}

function toMatch(m: RegExpExecArray): Match {
  return {
    text: m[0],
    index: m.index,
    length: m[0].length,
    groups: m.slice(1).map((g) => g ?? ""),
    named: (m.groups as Record<string, string> | undefined) ?? {},
  };
}

function highlight(input: string, matches: Match[]): React.ReactNode {
  if (!matches.length) return input;
  const out: React.ReactNode[] = [];
  let cur = 0;
  matches.forEach((m, i) => {
    if (m.index > cur) out.push(input.slice(cur, m.index));
    out.push(
      <mark
        key={i}
        className="rounded bg-yellow-200 px-0.5 text-slate-900 dark:bg-yellow-500/40 dark:text-yellow-100"
      >
        {input.slice(m.index, m.index + m.length)}
      </mark>,
    );
    cur = m.index + m.length;
  });
  if (cur < input.length) out.push(input.slice(cur));
  return out;
}

export default function RegexTestUi() {
  const [pattern, setPattern] = useState("\\b(\\w+)@(\\w+\\.\\w+)\\b");
  const [flags, setFlags] = useState("g");
  const [input, setInput] = useState(
    "邮件 alice@example.com 与 bob@test.org 来自不同域名。",
  );

  const { matches, err } = useMemo(
    () => runRegex(pattern, flags, input),
    [pattern, flags, input],
  );

  function toggleFlag(f: string) {
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : cur + f));
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <ToolField label="正则表达式" hint={`/${pattern}/${flags}`}>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950">
            <span className="font-mono text-sm text-slate-400">/</span>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="flex-1 bg-transparent font-mono text-sm text-slate-900 focus:outline-none dark:text-slate-100"
              placeholder="\d+"
              spellCheck={false}
            />
            <span className="font-mono text-sm text-slate-400">/{flags}</span>
          </div>
        </ToolField>

        <div className="flex flex-wrap gap-1.5">
          {FLAG_OPTIONS.map(({ f, label }) => (
            <button
              key={f}
              onClick={() => toggleFlag(f)}
              className={`rounded-md border px-2 py-1 text-xs transition ${
                flags.includes(f)
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <ToolField label="测试字符串">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            spellCheck={false}
          />
        </ToolField>

        {err ? (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {err}
          </div>
        ) : (
          <>
            <ToolField label={`匹配预览（${matches.length} 个）`}>
              <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm leading-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                {highlight(input, matches)}
              </div>
            </ToolField>
            {matches.length > 0 && (
              <ToolField label="匹配明细">
                <div className="space-y-1.5">
                  {matches.slice(0, 50).map((m, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">#{i}</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">
                          {m.text}
                        </span>
                        <span className="ml-auto text-slate-400">
                          [{m.index}, {m.index + m.length})
                        </span>
                      </div>
                      {m.groups.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-slate-500">
                          {m.groups.map((g, gi) => (
                            <span
                              key={gi}
                              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800"
                            >
                              ${gi + 1}: {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {matches.length > 50 && (
                    <div className="text-center text-xs text-slate-400">
                      （仅展示前 50 个，共 {matches.length} 个）
                    </div>
                  )}
                </div>
              </ToolField>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
