"use client";

import { Download, Loader2, Upload, X } from "lucide-react";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";

type Item = {
  id: string;
  original: File;
  compressed?: Blob;
  compressedUrl?: string;
  status: "pending" | "running" | "done" | "failed";
  error?: string;
};

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function ImageCompressUi() {
  const [items, setItems] = useState<Item[]>([]);
  const [maxKB, setMaxKB] = useState(500);
  const [maxDim, setMaxDim] = useState(2048);

  function addFiles(files: File[]) {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    setItems((cur) => [
      ...cur,
      ...imgs.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        original: f,
        status: "pending" as const,
      })),
    ]);
  }

  function removeItem(id: string) {
    setItems((cur) => {
      const target = cur.find((i) => i.id === id);
      if (target?.compressedUrl) URL.revokeObjectURL(target.compressedUrl);
      return cur.filter((i) => i.id !== id);
    });
  }

  async function compressAll() {
    for (const it of items) {
      if (it.status !== "pending") continue;
      setItems((cur) =>
        cur.map((x) => (x.id === it.id ? { ...x, status: "running" } : x)),
      );
      try {
        const blob = await imageCompression(it.original, {
          maxSizeMB: maxKB / 1024,
          maxWidthOrHeight: maxDim,
          useWebWorker: true,
        });
        const url = URL.createObjectURL(blob);
        setItems((cur) =>
          cur.map((x) =>
            x.id === it.id
              ? {
                  ...x,
                  status: "done",
                  compressed: blob,
                  compressedUrl: url,
                }
              : x,
          ),
        );
      } catch (e) {
        setItems((cur) =>
          cur.map((x) =>
            x.id === it.id
              ? {
                  ...x,
                  status: "failed",
                  error: e instanceof Error ? e.message : String(e),
                }
              : x,
          ),
        );
      }
    }
  }

  function download(it: Item) {
    if (!it.compressedUrl) return;
    const a = document.createElement("a");
    a.href = it.compressedUrl;
    const base = it.original.name.replace(/\.[^.]+$/, "");
    a.download = `${base}-compressed.${it.original.type.split("/")[1] || "jpg"}`;
    a.click();
  }

  const pending = items.filter((i) => i.status === "pending").length;

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolField label="目标大小（KB）" hint={`${maxKB} KB`}>
            <input
              type="range"
              min={50}
              max={5000}
              step={50}
              value={maxKB}
              onChange={(e) => setMaxKB(parseInt(e.target.value))}
              className="w-full"
            />
          </ToolField>
          <ToolField label="最大边长（像素）" hint={`${maxDim}px`}>
            <input
              type="range"
              min={512}
              max={4096}
              step={128}
              value={maxDim}
              onChange={(e) => setMaxDim(parseInt(e.target.value))}
              className="w-full"
            />
          </ToolField>
        </div>

        <DropZone onFiles={addFiles} />

        {items.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {items.length} 张图片
              </span>
              <button
                onClick={compressAll}
                disabled={pending === 0}
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                开始压缩 ({pending})
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {it.original.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>{fmtSize(it.original.size)}</span>
                      {it.compressed && (
                        <>
                          <span>→</span>
                          <span className="font-medium text-foreground">
                            {fmtSize(it.compressed.size)}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ↓{" "}
                            {Math.round(
                              (1 - it.compressed.size / it.original.size) * 100,
                            )}
                            %
                          </span>
                        </>
                      )}
                      {it.error && (
                        <span className="text-red-600">{it.error}</span>
                      )}
                    </div>
                  </div>
                  {it.status === "running" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {it.status === "done" && (
                    <button
                      onClick={() => download(it)}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent"
                    >
                      <Download className="h-3.5 w-3.5" /> 下载
                    </button>
                  )}
                  <button
                    onClick={() => removeItem(it.id)}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="移除"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
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
        onFiles(Array.from(e.dataTransfer.files));
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
        accept="image/*"
        className="hidden"
        onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
      />
      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
      <div className="mt-2 text-sm font-medium text-foreground">
        拖入图片或点击选择
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">
        支持 JPEG / PNG / WebP，多张批量处理
      </div>
    </label>
  );
}
