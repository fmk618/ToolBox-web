"use client";

import {
  ArrowDown,
  ArrowUp,
  Download,
  FilePlus2,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { ToolShell } from "../../components/tools/tool-shell";
import { meta } from "./meta";

type Item = { id: string; file: File; pages?: number };

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function PdfMergeUi() {
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function addFiles(files: File[]) {
    const pdfs = files.filter((f) => f.type === "application/pdf");
    const enriched: Item[] = [];
    for (const f of pdfs) {
      let pages: number | undefined;
      try {
        const buf = await f.arrayBuffer();
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        pages = doc.getPageCount();
      } catch {
        // leave undefined
      }
      enriched.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
        pages,
      });
    }
    setItems((cur) => [...cur, ...enriched]);
  }

  function move(id: string, dir: -1 | 1) {
    setItems((cur) => {
      const i = cur.findIndex((x) => x.id === id);
      if (i < 0) return cur;
      const j = i + dir;
      if (j < 0 || j >= cur.length) return cur;
      const next = [...cur];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function remove(id: string) {
    setItems((cur) => cur.filter((x) => x.id !== id));
  }

  async function merge() {
    if (items.length < 2) return;
    setBusy(true);
    setErr(null);
    try {
      const out = await PDFDocument.create();
      for (const it of items) {
        const buf = await it.file.arrayBuffer();
        const src = await PDFDocument.load(buf, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      }
      const bytes = await out.save();
      // Wrap raw bytes in BlobPart-compatible buffer to satisfy strict types.
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const totalPages = items.reduce((s, x) => s + (x.pages ?? 0), 0);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <DropZone onFiles={addFiles} />

        {items.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {items.length} 个文件 · 共 {totalPages} 页
              </span>
              <button
                onClick={merge}
                disabled={items.length < 2 || busy}
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                合并并下载
              </button>
            </div>

            {err && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {err}
              </div>
            )}

            <ol className="space-y-2">
              {items.map((it, idx) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-mono">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {it.file.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {fmtSize(it.file.size)}
                      {it.pages !== undefined && ` · ${it.pages} 页`}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => move(it.id, -1)}
                      disabled={idx === 0}
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      aria-label="上移"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => move(it.id, 1)}
                      disabled={idx === items.length - 1}
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                      aria-label="下移"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => remove(it.id)}
                      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="移除"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function DropZone({ onFiles }: { onFiles: (files: File[]) => Promise<void> }) {
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
        void onFiles(Array.from(e.dataTransfer.files));
      }}
      className={`block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging
          ? "border-foreground bg-accent"
          : "border-border bg-muted/30 hover:bg-muted/50"
      }`}
    >
      <input
        type="file"
        multiple
        accept="application/pdf"
        className="hidden"
        onChange={(e) => void onFiles(Array.from(e.target.files ?? []))}
      />
      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
      <div className="mt-2 text-sm font-medium text-foreground">
        拖入 PDF 文件或点击选择
      </div>
      <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <FilePlus2 className="h-3 w-3" /> 至少 2 个文件才能合并
      </div>
    </label>
  );
}
