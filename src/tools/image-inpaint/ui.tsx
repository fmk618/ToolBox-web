"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Download,
  Eraser,
  Loader2,
  Paintbrush,
  RotateCcw,
  Upload,
} from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { cn } from "../../lib/utils";
import { API_BASE } from "../../lib/api";
import { meta } from "./meta";

const MAX_DIM = 1200;

function fitDimensions(w: number, h: number): [number, number] {
  const scale = Math.min(1, MAX_DIM / Math.max(w, h));
  return [Math.round(w * scale), Math.round(h * scale)];
}

export default function ImageInpaintUi() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [canvasSize, setCanvasSize] = useState<[number, number] | null>(null);
  const [brushSize, setBrushSize] = useState(24);
  const [erasing, setErasing] = useState(false);
  const [hasMask, setHasMask] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const displayRef = useRef<HTMLCanvasElement>(null);
  const maskRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  function loadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const [w, h] = fitDimensions(img.naturalWidth, img.naturalHeight);
      setCanvasSize([w, h]);
      setImageFile(file);
      setResultUrl(null);
      setHasMask(false);
      setError(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  // Init canvases when size changes
  useEffect(() => {
    if (!canvasSize) return;
    const [w, h] = canvasSize;
    const dc = displayRef.current;
    const mc = maskRef.current;
    if (!dc || !mc || !imgRef.current) return;
    dc.width = w;
    dc.height = h;
    mc.width = w;
    mc.height = h;
    const dCtx = dc.getContext("2d")!;
    dCtx.drawImage(imgRef.current, 0, 0, w, h);
    mc.getContext("2d")!.clearRect(0, 0, w, h);
  }, [canvasSize]);

  const redrawDisplay = useCallback(() => {
    const dc = displayRef.current;
    const mc = maskRef.current;
    if (!dc || !mc || !imgRef.current) return;
    const [w, h] = [dc.width, dc.height];
    const dCtx = dc.getContext("2d")!;

    dCtx.drawImage(imgRef.current, 0, 0, w, h);

    // Overlay: red tint where mask is opaque
    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    const tCtx = temp.getContext("2d")!;
    tCtx.fillStyle = "#ef4444";
    tCtx.fillRect(0, 0, w, h);
    tCtx.globalCompositeOperation = "destination-in";
    tCtx.drawImage(mc, 0, 0);

    dCtx.globalAlpha = 0.55;
    dCtx.drawImage(temp, 0, 0);
    dCtx.globalAlpha = 1;
  }, []);

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const c = displayRef.current!;
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * c.width) / r.width,
      y: ((e.clientY - r.top) * c.height) / r.height,
    };
  }

  function strokeAt(x: number, y: number, fromX?: number, fromY?: number) {
    const mc = maskRef.current;
    if (!mc) return;
    const mCtx = mc.getContext("2d")!;

    if (erasing) {
      mCtx.globalCompositeOperation = "destination-out";
      mCtx.strokeStyle = "rgba(0,0,0,1)";
      mCtx.fillStyle = "rgba(0,0,0,1)";
    } else {
      mCtx.globalCompositeOperation = "source-over";
      mCtx.strokeStyle = "rgba(255,255,255,1)";
      mCtx.fillStyle = "rgba(255,255,255,1)";
    }

    mCtx.lineWidth = brushSize;
    mCtx.lineCap = "round";
    mCtx.lineJoin = "round";

    mCtx.beginPath();
    if (fromX !== undefined && fromY !== undefined) {
      mCtx.moveTo(fromX, fromY);
      mCtx.lineTo(x, y);
      mCtx.stroke();
    } else {
      mCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      mCtx.fill();
    }
    mCtx.globalCompositeOperation = "source-over";
    redrawDisplay();
    if (!erasing) setHasMask(true);
  }

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const pos = getPos(e);
    lastPos.current = pos;
    strokeAt(pos.x, pos.y);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const pos = getPos(e);
    const lp = lastPos.current;
    strokeAt(pos.x, pos.y, lp?.x, lp?.y);
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    drawing.current = false;
    lastPos.current = null;
  };

  function clearMask() {
    const mc = maskRef.current;
    if (!mc) return;
    mc.getContext("2d")!.clearRect(0, 0, mc.width, mc.height);
    redrawDisplay();
    setHasMask(false);
  }

  async function submit() {
    const mc = maskRef.current;
    if (!mc || !imgRef.current) return;

    setProcessing(true);
    setError(null);

    try {
      // Build black/white mask
      const offscreen = document.createElement("canvas");
      offscreen.width = mc.width;
      offscreen.height = mc.height;
      const oCtx = offscreen.getContext("2d")!;
      oCtx.fillStyle = "black";
      oCtx.fillRect(0, 0, mc.width, mc.height);

      const raw = mc.getContext("2d")!.getImageData(0, 0, mc.width, mc.height);
      const bw = oCtx.createImageData(mc.width, mc.height);
      for (let i = 0; i < raw.data.length; i += 4) {
        const v = raw.data[i + 3] > 10 ? 255 : 0;
        bw.data[i] = v;
        bw.data[i + 1] = v;
        bw.data[i + 2] = v;
        bw.data[i + 3] = 255;
      }
      oCtx.putImageData(bw, 0, 0);

      const maskBlob = await new Promise<Blob>((res) =>
        offscreen.toBlob((b) => res(b!), "image/png"),
      );

      // Scaled image at canvas resolution
      const imgCanvas = document.createElement("canvas");
      imgCanvas.width = mc.width;
      imgCanvas.height = mc.height;
      imgCanvas.getContext("2d")!.drawImage(imgRef.current, 0, 0, mc.width, mc.height);
      const imgBlob = await new Promise<Blob>((res) =>
        imgCanvas.toBlob((b) => res(b!), "image/png"),
      );

      const fd = new FormData();
      fd.append("file", imgBlob, "image.png");
      fd.append("mask", maskBlob, "mask.png");

      const res = await fetch(`${API_BASE}/tools/image-inpaint/remove`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
      }

      const blob = await res.blob();
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProcessing(false);
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        {/* Upload */}
        {!canvasSize && (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-slate-500 transition",
              dragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900",
            )}
          >
            <Upload className="h-8 w-8" />
            <span className="text-sm font-medium">点击或拖拽上传图片</span>
            <span className="text-xs text-slate-400">支持 PNG / JPEG / WebP / BMP · 自动缩放到 1200px</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); }}
            />
          </label>
        )}

        {/* Editor */}
        {canvasSize && (
          <>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setErasing(false)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition",
                  !erasing
                    ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400",
                )}
              >
                <Paintbrush className="h-3.5 w-3.5" />
                涂抹
              </button>

              <button
                onClick={() => setErasing(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition",
                  erasing
                    ? "border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400",
                )}
              >
                <Eraser className="h-3.5 w-3.5" />
                擦除
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">笔刷</span>
                <input
                  type="range"
                  min={4}
                  max={80}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-24"
                />
                <span className="w-6 text-xs tabular-nums text-slate-500 dark:text-slate-400">{brushSize}</span>
              </div>

              <button
                onClick={clearMask}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                清除标记
              </button>

              <button
                onClick={() => { setCanvasSize(null); setImageFile(null); setResultUrl(null); setHasMask(false); }}
                className="ml-auto text-xs text-slate-400 hover:underline"
              >
                重新上传
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              在图片上用<span className="mx-0.5 font-medium text-red-500">涂抹</span>工具圈出要去除的区域，支持水印、文字、Logo 等，然后点击「去除并修复」
            </p>

            {/* Canvas */}
            <div
              className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
              style={{ cursor: erasing ? "cell" : "crosshair" }}
            >
              <canvas
                ref={displayRef}
                className="block w-full"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              {/* Hidden mask canvas — same dimensions, not rendered */}
              <canvas ref={maskRef} className="hidden" />
            </div>

            {/* Submit */}
            <button
              onClick={submit}
              disabled={processing || !hasMask}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {processing ? "修复中…" : hasMask ? "去除并修复" : "请先涂抹要去除的区域"}
            </button>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Result */}
            {resultUrl && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">修复结果</p>
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={resultUrl} className="block w-full" alt="修复结果" />
                </div>
                <a
                  href={resultUrl}
                  download="inpainted.png"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-500 bg-green-50 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
                >
                  <Download className="h-4 w-4" />
                  下载 PNG
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}
