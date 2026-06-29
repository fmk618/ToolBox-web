"use client";

import { Download, ImageDown } from "lucide-react";
import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";
import { buildRegexDiagram } from "./diagram";

const EXAMPLES = [
  { label: "邮箱", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.]+", flags: "g", sample: "联系 alice@example.com 或 bob.test+tag@mail.org" },
  { label: "手机号", pattern: "1[3-9]\\d{9}", flags: "g", sample: "电话 13812345678，备用 19987654321" },
  { label: "中文", pattern: "[\\u4e00-\\u9fa5]+", flags: "g", sample: "Hello 世界，welcome 欢迎" },
  { label: "日期", pattern: "\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}", flags: "g", sample: "2024-01-15 或 2024/6/8" },
  { label: "URL", pattern: "https?://[\\w/:%#$&?()~.=+\\-]+", flags: "gi", sample: "访问 https://example.com/path?q=1 了解详情" },
  { label: "IP 地址", pattern: "\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}", flags: "g", sample: "服务器 192.168.1.1 和 10.0.0.255" },
  { label: "身份证", pattern: "[1-9]\\d{5}(19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dX]", flags: "gi", sample: "110101199001011234" },
  { label: "十六进制色", pattern: "#[0-9a-fA-F]{3,6}\\b", flags: "g", sample: "颜色 #fff #3a7bd5 #FF0000" },
  { label: "整数/小数", pattern: "-?\\d+(\\.\\d+)?", flags: "g", sample: "价格 -3.14，数量 42，折扣 0.85" },
  { label: "HTML 标签", pattern: "<[^>]+>", flags: "g", sample: "<div class=\"box\"><p>内容</p></div>" },
] as const;

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function svgToPng(svg: string, width: number, height: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((b) => resolve(b), "image/png");
    };
    img.onerror = () => resolve(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
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

  const diagram = useMemo(() => buildRegexDiagram(pattern, flags), [pattern, flags]);

  async function exportPng() {
    if ("error" in diagram) return;
    const blob = await svgToPng(diagram.svg, diagram.width, diagram.height);
    if (blob) downloadBlob(blob, "regex.png");
  }
  function exportSvg() {
    if ("error" in diagram) return;
    downloadBlob(new Blob([diagram.svg], { type: "image/svg+xml" }), "regex.svg");
  }

  function toggleFlag(f: string) {
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : cur + f));
  }

  function loadExample(ex: (typeof EXAMPLES)[number]) {
    setPattern(ex.pattern);
    setFlags(ex.flags);
    setInput(ex.sample);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">常用示例 — 点击快速加载</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                onClick={() => loadExample(ex)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

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

        <ToolField
          label="结构可视化"
          action={
            !("error" in diagram) ? (
              <div className="flex gap-1.5">
                <button
                  onClick={exportPng}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <ImageDown className="h-3.5 w-3.5" /> PNG
                </button>
                <button
                  onClick={exportSvg}
                  className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <Download className="h-3.5 w-3.5" /> SVG
                </button>
              </div>
            ) : undefined
          }
        >
          <div className="overflow-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700">
            {"error" in diagram ? (
              <div className="px-2 py-8 text-center text-sm text-slate-400">
                {diagram.error}
              </div>
            ) : (
              <div
                className="min-w-fit"
                dangerouslySetInnerHTML={{ __html: diagram.svg }}
              />
            )}
          </div>
        </ToolField>

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
