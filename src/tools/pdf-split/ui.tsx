"use client";

import { Download, FileText, Loader2, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";

/**
 * 解析页码范围串，如 "1-3,5,8-10"。
 * 返回去重升序的 1 基页码；任何非法 token 或越界（>total）都报错。
 */
function parseRanges(
  spec: string,
  total: number,
): { pages: number[]; error: string | null } {
  const trimmed = spec.trim();
  if (!trimmed) return { pages: [], error: null };

  const set = new Set<number>();
  for (const rawPart of trimmed.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    const single = /^(\d+)$/.exec(part);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      if (a < 1 || b < 1 || a > total || b > total) {
        return { pages: [], error: `页码超出范围（共 ${total} 页）：${part}` };
      }
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      for (let p = lo; p <= hi; p++) set.add(p);
    } else if (single) {
      const p = Number(single[1]);
      if (p < 1 || p > total) {
        return { pages: [], error: `页码超出范围（共 ${total} 页）：${part}` };
      }
      set.add(p);
    } else {
      return { pages: [], error: `无法识别：“${part}”（示例：1-3,5,8-10）` };
    }
  }
  return { pages: [...set].sort((x, y) => x - y), error: null };
}

export default function PdfSplitUi() {
  const [file, setFile] = useState<File | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [spec, setSpec] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(f: File | undefined) {
    setErr(null);
    setTotal(null);
    if (!f) return;
    if (f.type !== "application/pdf") {
      setErr("请选择 PDF 文件");
      return;
    }
    setFile(f);
    try {
      const buf = await f.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setTotal(doc.getPageCount());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setFile(null);
    }
  }

  const parsed = useMemo(
    () => (total ? parseRanges(spec, total) : { pages: [], error: null }),
    [spec, total],
  );

  async function extract() {
    if (!file || !total || parsed.pages.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      const buf = await file.arrayBuffer();
      const src = await PDFDocument.load(buf, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      // pdf-lib 是 0 基索引，输入是 1 基
      const copied = await out.copyPages(
        src,
        parsed.pages.map((p) => p - 1),
      );
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = file.name.replace(/\.pdf$/i, "");
      a.download = `${base}-提取${parsed.pages.length}页.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        {!file ? (
          <DropZone onFile={onFile} />
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{file.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {total !== null ? `共 ${total} 页` : "读取中…"}
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setTotal(null);
                setSpec("");
                setErr(null);
              }}
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="移除"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {err && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {err}
          </div>
        )}

        {file && total !== null && (
          <>
            <ToolField
              label="要提取的页码"
              hint="逗号分隔，区间用连字符，如 1-3,5,8-10"
            >
              <input
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                placeholder={`例如 1-${total}`}
                className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm dark:text-foreground"
              />
            </ToolField>

            {parsed.error ? (
              <div className="text-xs text-red-600 dark:text-red-400">
                {parsed.error}
              </div>
            ) : (
              parsed.pages.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  将提取 {parsed.pages.length} 页：
                  <span className="font-mono text-foreground">
                    {parsed.pages.join(", ")}
                  </span>
                </div>
              )
            )}

            <button
              onClick={extract}
              disabled={busy || parsed.pages.length === 0 || !!parsed.error}
              className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              提取并下载
            </button>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function DropZone({ onFile }: { onFile: (f: File | undefined) => Promise<void> }) {
  const [dragging, setDragging] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void onFile(e.dataTransfer.files[0]);
      }}
      className={`block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging
          ? "border-foreground bg-accent"
          : "border-border bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <input
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
      <div className="mt-2 text-sm font-medium text-foreground">
        拖入 PDF 文件或点击选择
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        本地处理，文件不会上传服务器
      </div>
    </label>
  );
}
