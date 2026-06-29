"use client";

import { Download, ImageUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ToolShell } from "../../components/tools/tool-shell";
import { cn } from "../../lib/utils";
import { meta } from "./meta";
import { buildIco, ICO_SIZES, loadImage } from "./lib";

export default function ImageToIcoUi() {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState("");
  const [sizes, setSizes] = useState<Set<number>>(
    new Set([16, 32, 48, 256]),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    try {
      const image = await loadImage(file);
      setImg(image);
      setName(file.name.replace(/\.[^.]+$/, ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取失败");
    }
  }

  function toggleSize(s: number) {
    setSizes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  async function download() {
    if (!img || sizes.size === 0) return;
    setBusy(true);
    try {
      const blob = await buildIco(img, [...sizes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "icon"}.ico`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        {/* 选择 / 拖放 */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/20 px-4 py-10 text-center transition-colors hover:border-ring/60 hover:bg-muted/40"
        >
          <ImageUp className="h-7 w-7 text-muted-foreground" />
          <div className="text-sm text-foreground">点击选择或拖入图片</div>
          <div className="text-xs text-muted-foreground">
            建议使用正方形 PNG（透明背景更佳）
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            {error}
          </div>
        )}

        {img && (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt="原图"
                className="h-16 w-16 rounded-lg border border-border object-contain"
              />
              <div className="text-sm">
                <div className="font-medium text-foreground">{name}</div>
                <div className="text-xs text-muted-foreground">
                  原始尺寸 {img.naturalWidth} × {img.naturalHeight}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-foreground">
                选择导出尺寸（可多选，自动打包进同一个 .ico）
              </div>
              <div className="flex flex-wrap gap-2">
                {ICO_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm transition-colors",
                      sizes.has(s)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>

            {/* 各尺寸预览 */}
            <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4">
              {[...sizes]
                .sort((a, b) => a - b)
                .map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1.5">
                    <Preview img={img} size={Math.min(s, 64)} />
                    <span className="text-[11px] text-muted-foreground">{s}px</span>
                  </div>
                ))}
              {sizes.size === 0 && (
                <span className="text-sm text-muted-foreground">请至少选择一个尺寸</span>
              )}
            </div>

            <button
              onClick={download}
              disabled={busy || sizes.size === 0}
              className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              {busy ? "生成中…" : `下载 .ico（${sizes.size} 个尺寸）`}
            </button>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function Preview({ img, size }: { img: HTMLImageElement; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  }, [img, size]);
  return (
    <canvas
      ref={ref}
      className="rounded border border-border"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
}
