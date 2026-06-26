"use client";

import { useState } from "react";
import { Download, Loader2, Upload, X } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { convertFile } from "../../lib/api";
import { meta } from "./meta";

const TARGET_FMTS = [
  { label: "JPG",  value: "jpg"  },
  { label: "PNG",  value: "png"  },
  { label: "WebP", value: "webp" },
  { label: "AVIF", value: "avif" },
  { label: "GIF",  value: "gif"  },
  { label: "BMP",  value: "bmp"  },
  { label: "TIFF", value: "tiff" },
  { label: "ICO",  value: "ico"  },
];

function srcFmt(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return { jpeg: "jpg", tif: "tiff" }[ext] ?? ext;
}

type Status = "idle" | "converting" | "done" | "error";

interface Result {
  blob: Blob;
  filename: string;
  url: string;
}

export default function ImageConvertUi() {
  const [file, setFile]     = useState<File | null>(null);
  const [to, setTo]         = useState<string>("webp");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function pickFile(f: File) {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(f);
    setResult(null);
    setError(null);
    setStatus("idle");
    // Auto-skip to a different format if src === current target
    const src = srcFmt(f.name);
    if (src === to) {
      const fallback = TARGET_FMTS.find((x) => x.value !== src);
      if (fallback) setTo(fallback.value);
    }
  }

  async function convert() {
    if (!file) return;
    setStatus("converting");
    setError(null);
    try {
      const { blob, filename } = await convertFile(file, to);
      const url = URL.createObjectURL(blob);
      setResult({ blob, filename, url });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.filename;
    a.click();
  }

  function reset() {
    if (result?.url) URL.revokeObjectURL(result.url);
    setFile(null);
    setResult(null);
    setError(null);
    setStatus("idle");
  }

  const src = file ? srcFmt(file.name) : null;

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">

        {/* Drop zone */}
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) pickFile(f);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragging
              ? "border-foreground bg-accent"
              : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
          />
          {file ? (
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium">{file.name}</div>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); reset(); }}
                className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm font-medium">拖入图片或点击选择</div>
              <div className="text-xs text-muted-foreground">
                支持 JPG / PNG / WebP / AVIF / GIF / BMP / TIFF / ICO
              </div>
            </>
          )}
        </label>

        {/* Target format selector */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">目标格式</div>
          <div className="flex flex-wrap gap-2">
            {TARGET_FMTS.map((fmt) => {
              const isSrc = src === fmt.value;
              const active = to === fmt.value;
              return (
                <button
                  key={fmt.value}
                  disabled={isSrc}
                  onClick={() => setTo(fmt.value)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isSrc
                      ? "cursor-not-allowed border-border text-muted-foreground/40"
                      : active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-card text-foreground hover:bg-accent"
                  }`}
                >
                  {fmt.label}
                  {isSrc && <span className="ml-1 text-[10px]">源</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Convert button */}
        <button
          onClick={convert}
          disabled={!file || status === "converting"}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {status === "converting" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> 转换中…</>
          ) : (
            `转换为 ${to.toUpperCase()}`
          )}
        </button>

        {/* Error */}
        {status === "error" && error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Result */}
        {status === "done" && result && (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div>
              <div className="text-sm font-medium">{result.filename}</div>
              <div className="text-xs text-muted-foreground">
                {(result.blob.size / 1024).toFixed(1)} KB
              </div>
            </div>
            <button
              onClick={download}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" /> 下载
            </button>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
