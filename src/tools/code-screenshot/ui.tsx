"use client";

import { useRef, useState, useMemo } from "react";
import { Download, Loader2 } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { meta } from "./meta";

// ── highlight.js — core + selective language imports ────────────────────────
import hljs from "highlight.js/lib/core";
import langTs        from "highlight.js/lib/languages/typescript";
import langJs        from "highlight.js/lib/languages/javascript";
import langPython    from "highlight.js/lib/languages/python";
import langBash      from "highlight.js/lib/languages/bash";
import langJson      from "highlight.js/lib/languages/json";
import langCss       from "highlight.js/lib/languages/css";
import langHtml      from "highlight.js/lib/languages/xml"; // xml covers html
import langRust      from "highlight.js/lib/languages/rust";
import langGo        from "highlight.js/lib/languages/go";
import langSql       from "highlight.js/lib/languages/sql";
import langJava      from "highlight.js/lib/languages/java";
import langCpp       from "highlight.js/lib/languages/cpp";
import langKotlin    from "highlight.js/lib/languages/kotlin";
import langYaml      from "highlight.js/lib/languages/yaml";
import langMarkdown  from "highlight.js/lib/languages/markdown";

hljs.registerLanguage("typescript",  langTs);
hljs.registerLanguage("javascript",  langJs);
hljs.registerLanguage("python",      langPython);
hljs.registerLanguage("bash",        langBash);
hljs.registerLanguage("json",        langJson);
hljs.registerLanguage("css",         langCss);
hljs.registerLanguage("html",        langHtml);
hljs.registerLanguage("rust",        langRust);
hljs.registerLanguage("go",          langGo);
hljs.registerLanguage("sql",         langSql);
hljs.registerLanguage("java",        langJava);
hljs.registerLanguage("cpp",         langCpp);
hljs.registerLanguage("kotlin",      langKotlin);
hljs.registerLanguage("yaml",        langYaml);
hljs.registerLanguage("markdown",    langMarkdown);

// ── themes (token colors inlined for html-to-image compatibility) ──────────
type ThemeDef = {
  bg: string;         // editor background
  gutter: string;     // title bar
  fg: string;         // default text
  tokens: Record<string, string>; // hljs class → color
};

const THEMES: Record<string, ThemeDef> = {
  "One Dark": {
    bg: "#282c34", gutter: "#21252b", fg: "#abb2bf",
    tokens: {
      keyword: "#c678dd", built_in: "#e5c07b", type: "#e5c07b",
      string: "#98c379", number: "#d19a66", comment: "#5c6370",
      function: "#61afef", title: "#61afef", params: "#abb2bf",
      attr: "#e06c75", meta: "#56b6c2", tag: "#e06c75",
      name: "#e06c75", selector_tag: "#e06c75", selector_id: "#e06c75",
      selector_class: "#e5c07b", attribute: "#e06c75", variable: "#e06c75",
      operator: "#56b6c2", punctuation: "#abb2bf", literal: "#d19a66",
      symbol: "#61afef", link: "#98c379", deletion: "#e06c75",
      addition: "#98c379",
    },
  },
  "Dracula": {
    bg: "#282a36", gutter: "#21222c", fg: "#f8f8f2",
    tokens: {
      keyword: "#ff79c6", built_in: "#8be9fd", type: "#8be9fd",
      string: "#f1fa8c", number: "#bd93f9", comment: "#6272a4",
      function: "#50fa7b", title: "#50fa7b", params: "#ffb86c",
      attr: "#ff79c6", meta: "#ff79c6", tag: "#ff79c6",
      name: "#8be9fd", selector_tag: "#ff79c6", attribute: "#50fa7b",
      variable: "#bd93f9", operator: "#ff79c6", punctuation: "#f8f8f2",
      literal: "#bd93f9", symbol: "#8be9fd",
    },
  },
  "GitHub Light": {
    bg: "#ffffff", gutter: "#f6f8fa", fg: "#24292f",
    tokens: {
      keyword: "#cf222e", built_in: "#953800", type: "#953800",
      string: "#0a3069", number: "#0550ae", comment: "#6e7781",
      function: "#8250df", title: "#8250df", params: "#24292f",
      attr: "#0550ae", meta: "#6f42c1", tag: "#116329",
      name: "#116329", selector_tag: "#116329", attribute: "#0550ae",
      variable: "#cf222e", operator: "#24292f", punctuation: "#24292f",
      literal: "#0550ae",
    },
  },
  "Nord": {
    bg: "#2e3440", gutter: "#272c36", fg: "#d8dee9",
    tokens: {
      keyword: "#81a1c1", built_in: "#81a1c1", type: "#8fbcbb",
      string: "#a3be8c", number: "#b48ead", comment: "#4c566a",
      function: "#88c0d0", title: "#88c0d0", params: "#d8dee9",
      attr: "#81a1c1", meta: "#88c0d0", tag: "#81a1c1",
      name: "#81a1c1", selector_tag: "#81a1c1", attribute: "#8fbcbb",
      variable: "#d8dee9", operator: "#81a1c1", punctuation: "#eceff4",
      literal: "#b48ead",
    },
  },
  "Night Owl": {
    bg: "#011627", gutter: "#01111d", fg: "#d6deeb",
    tokens: {
      keyword: "#c792ea", built_in: "#addb67", type: "#82aaff",
      string: "#ecc48d", number: "#f78c6c", comment: "#637777",
      function: "#82aaff", title: "#82aaff", params: "#d6deeb",
      attr: "#c792ea", meta: "#82aaff", tag: "#7fdbca",
      name: "#7fdbca", selector_tag: "#7fdbca", attribute: "#addb67",
      variable: "#addb67", operator: "#c792ea", punctuation: "#d6deeb",
      literal: "#ff5874",
    },
  },
  "Solarized": {
    bg: "#002b36", gutter: "#073642", fg: "#839496",
    tokens: {
      keyword: "#859900", built_in: "#2aa198", type: "#b58900",
      string: "#2aa198", number: "#d33682", comment: "#586e75",
      function: "#268bd2", title: "#268bd2", params: "#657b83",
      attr: "#2aa198", meta: "#cb4b16", tag: "#268bd2",
      name: "#268bd2", selector_tag: "#268bd2", attribute: "#b58900",
      variable: "#cb4b16", operator: "#839496", punctuation: "#839496",
      literal: "#d33682",
    },
  },
};

const THEME_KEYS = Object.keys(THEMES);

// ── language options ────────────────────────────────────────────────────────
const LANGS = [
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "Python",     value: "python" },
  { label: "Bash",       value: "bash" },
  { label: "JSON",       value: "json" },
  { label: "CSS",        value: "css" },
  { label: "HTML",       value: "html" },
  { label: "Rust",       value: "rust" },
  { label: "Go",         value: "go" },
  { label: "SQL",        value: "sql" },
  { label: "Java",       value: "java" },
  { label: "C++",        value: "cpp" },
  { label: "Kotlin",     value: "kotlin" },
  { label: "YAML",       value: "yaml" },
  { label: "Markdown",   value: "markdown" },
];

const PADDINGS = [16, 32, 48, 64];

const DEFAULT_CODE = `function greet(name: string): string {
  // Say hello to the world
  return \`Hello, \${name}!\`;
}

console.log(greet("Toolbox"));`;

// ── build inline <style> for hljs tokens ───────────────────────────────────
function buildStyle(theme: ThemeDef): string {
  const base = `color:${theme.fg};background:${theme.bg};`;
  const rules = Object.entries(theme.tokens)
    .map(([cls, color]) => `.hljs-${cls}{color:${color};}`)
    .join("");
  return `${base}${rules}.hljs{display:block;overflow-x:auto;padding:0;}`;
}

// ── component ──────────────────────────────────────────────────────────────
export default function CodeScreenshotUi() {
  const screenshotRef = useRef<HTMLDivElement>(null);
  const [code,    setCode]    = useState(DEFAULT_CODE);
  const [lang,    setLang]    = useState("typescript");
  const [theme,   setTheme]   = useState("One Dark");
  const [padding, setPadding] = useState(32);
  const [bgColor, setBgColor] = useState("#1a1a2e");
  const [exporting, setExporting] = useState(false);

  const currentTheme = THEMES[theme] ?? THEMES["One Dark"];

  const highlighted = useMemo(() => {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch {
      return hljs.highlightAuto(code).value;
    }
  }, [code, lang]);

  const inlineStyle = useMemo(() => buildStyle(currentTheme), [currentTheme]);

  async function exportPng() {
    if (!screenshotRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(screenshotRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "code.png";
      a.click();
    } finally {
      setExporting(false);
    }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        {/* Controls row 1: language + theme */}
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="mb-1 text-xs font-medium text-muted-foreground">语言</div>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm focus:border-ring focus:outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className="mb-1 text-xs font-medium text-muted-foreground">主题</div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full rounded-md border border-input bg-muted/50 px-3 py-1.5 text-sm focus:border-ring focus:outline-none"
            >
              {THEME_KEYS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Controls row 2: padding + bg color */}
        <div className="flex items-center gap-4">
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">内边距</div>
            <div className="flex gap-1.5">
              {PADDINGS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPadding(p)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    padding === p
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">背景色</div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent"
              />
              <span className="font-mono text-xs text-muted-foreground">{bgColor}</span>
            </div>
          </div>
        </div>

        {/* Code input */}
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">代码</div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full resize-y rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-xs focus:border-ring focus:bg-background focus:outline-none"
            placeholder="粘贴代码…"
          />
        </div>

        {/* Preview */}
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">预览</div>
          <div className="overflow-auto rounded-lg border border-border">
            {/* This div is what gets captured by html-to-image */}
            <div
              ref={screenshotRef}
              style={{ background: bgColor, padding, display: "inline-block", minWidth: "100%" }}
            >
              {/* Window chrome */}
              <div
                style={{
                  background: currentTheme.bg,
                  borderRadius: 10,
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
              >
                {/* Title bar */}
                <div
                  style={{
                    background: currentTheme.gutter,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", display: "inline-block" }} />
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffbd2e", display: "inline-block" }} />
                  <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", display: "inline-block" }} />
                  <span style={{ flex: 1, textAlign: "center", fontSize: 11, color: currentTheme.fg, opacity: 0.4, fontFamily: "monospace" }}>
                    {LANGS.find((l) => l.value === lang)?.label ?? lang}
                  </span>
                </div>
                {/* Code area */}
                <div style={{ position: "relative" }}>
                  <style dangerouslySetInnerHTML={{ __html: `#cs-code{${inlineStyle}}` }} />
                  <pre
                    id="cs-code"
                    style={{
                      margin: 0,
                      padding: "20px 24px",
                      fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', Consolas, monospace",
                      fontSize: 13,
                      lineHeight: 1.65,
                      tabSize: 2,
                      overflowX: "auto",
                    }}
                  >
                    <code dangerouslySetInnerHTML={{ __html: highlighted }} />
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export button */}
        <button
          onClick={exportPng}
          disabled={exporting || !code.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {exporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 生成中…</>
          ) : (
            <><Download className="h-4 w-4" /> 下载 PNG（2×）</>
          )}
        </button>
      </div>
    </ToolShell>
  );
}
