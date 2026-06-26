"use client";

import { useState } from "react";
import { ToolShell } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

// ── pure-browser SVG optimizer ──────────────────────────────────────────────
function optimizeSvg(raw: string): string {
  let s = raw;

  // Remove XML declaration and DOCTYPE
  s = s.replace(/<\?xml[^?]*\?>/g, "");
  s = s.replace(/<!DOCTYPE[^>]*>/gi, "");

  // Remove comments
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // Remove <title>, <desc>, <metadata> blocks
  s = s.replace(/<title[\s\S]*?<\/title>/gi, "");
  s = s.replace(/<desc[\s\S]*?<\/desc>/gi, "");
  s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");

  // Remove version="1.1" and xml:space attributes
  s = s.replace(/\s+version="[^"]*"/g, "");
  s = s.replace(/\s+xml:space="[^"]*"/g, "");

  // Remove unused xmlns:xlink if no xlink: usage
  if (!s.includes("xlink:")) {
    s = s.replace(/\s+xmlns:xlink="[^"]*"/g, "");
  }

  // Shorten floating-point numbers (max 3 decimal places)
  s = s.replace(/(\d+\.\d{4,})/g, (m) => parseFloat(parseFloat(m).toFixed(3)).toString());

  // Collapse whitespace between tags
  s = s.replace(/>\s+</g, "><");

  // Collapse runs of whitespace inside attribute values is risky — skip
  // Collapse leading/trailing whitespace on each line
  s = s.replace(/[ \t]+/g, " ");

  // Remove empty style attributes
  s = s.replace(/\s+style=""/g, "");

  // Remove empty class attributes
  s = s.replace(/\s+class=""/g, "");

  return s.trim();
}

function pct(orig: number, opt: number) {
  if (!orig) return "0";
  return ((1 - opt / orig) * 100).toFixed(1);
}

// ── component ──────────────────────────────────────────────────────────────
export default function SvgMinUi() {
  const [input, setInput]   = useState("");
  const [output, setOutput] = useState("");
  const [preview, setPreview] = useState(false);

  function run() {
    if (!input.trim()) return;
    setOutput(optimizeSvg(input));
  }

  const origBytes = new TextEncoder().encode(input).length;
  const optBytes  = new TextEncoder().encode(output).length;
  const saving    = pct(origBytes, optBytes);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        {/* Input */}
        <div>
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">输入 SVG</div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(""); }}
            placeholder="粘贴 SVG 代码…"
            rows={8}
            className="w-full resize-y rounded-md border border-input bg-muted/50 px-3 py-2 font-mono text-xs focus:border-ring focus:bg-background focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Action */}
        <button
          onClick={run}
          disabled={!input.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          优化 SVG
        </button>

        {/* Output */}
        {output && (
          <>
            {/* Stats */}
            <div className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 text-sm">
              <div>
                <span className="text-muted-foreground">原始</span>{" "}
                <span className="font-mono font-medium">{origBytes} B</span>
              </div>
              <div className="text-muted-foreground/40">→</div>
              <div>
                <span className="text-muted-foreground">优化后</span>{" "}
                <span className="font-mono font-medium">{optBytes} B</span>
              </div>
              <div className="ml-auto font-semibold text-emerald-600 dark:text-emerald-400">
                -{saving}%
              </div>
            </div>

            {/* Output textarea */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">优化结果</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreview((p) => !p)}
                    className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:bg-accent"
                  >
                    {preview ? "代码" : "预览"}
                  </button>
                  <CopyButton value={output} />
                </div>
              </div>
              {preview ? (
                <div
                  className="flex min-h-32 items-center justify-center rounded-lg border border-border bg-card p-4"
                  dangerouslySetInnerHTML={{ __html: output }}
                />
              ) : (
                <textarea
                  readOnly
                  value={output}
                  rows={8}
                  className="w-full resize-y rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs focus:outline-none"
                />
              )}
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}
