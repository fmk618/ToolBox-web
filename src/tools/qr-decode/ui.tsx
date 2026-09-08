"use client";

import { useState } from "react";
import { ExternalLink, ScanLine } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { meta } from "./meta";
import { decodeQr, supportedDetector } from "./lib";

function asSafeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

export default function QrDecodeUi() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filename, setFilename] = useState("");
  const url = asSafeHttpUrl(result);

  async function load(files: File[]) {
    const file = files[0];
    if (!file) return;
    setLoading(true); setError(""); setResult(""); setFilename(file.name);
    try { setResult(await decodeQr(file)); }
    catch (e) { setError(e instanceof Error ? e.message : "识别失败"); }
    finally { setLoading(false); }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <FileDropZone
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
          onFiles={load}
          title={loading ? "正在识别二维码…" : "拖入二维码图片，或"}
          hint={supportedDetector() ? "图片仅在浏览器中识别，不会上传" : "当前浏览器可能不支持识别；建议使用最新版 Chrome 或 Edge"}
          className={loading ? "pointer-events-none opacity-70" : undefined}
        />
        {error && <ErrorBox>{error}</ErrorBox>}
        {result && <section className="rounded-xl border border-border bg-background p-4"><div className="mb-2 flex items-baseline justify-between gap-3"><span className="truncate text-xs text-muted-foreground">来自 {filename}</span><CopyButton value={result} /></div><pre className="whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono text-sm text-foreground">{result}</pre>{url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"><ExternalLink className="h-4 w-4" />在新标签页打开链接</a>}</section>}
        {!result && !error && <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground"><ScanLine className="h-3.5 w-3.5" />支持识别网址、文本、Wi‑Fi 配置等二维码内容</p>}
      </div>
    </ToolShell>
  );
}
