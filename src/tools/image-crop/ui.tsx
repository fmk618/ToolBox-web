"use client";

import {
  Download,
  FlipHorizontal2,
  FlipVertical2,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";
import type Cropper from "cropperjs";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { cn } from "../../lib/utils";
import { meta } from "./meta";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const ASPECT_RATIOS = [
  { value: "free", label: "自由", ratio: Number.NaN },
  { value: "1", label: "1:1", ratio: 1 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "3:4", label: "3:4", ratio: 3 / 4 },
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
  { value: "9:16", label: "9:16", ratio: 9 / 16 },
] as const;

type AspectRatio = (typeof ASPECT_RATIOS)[number]["value"];
type OutputFormat = "png" | "jpeg" | "webp";

export default function ImageCropUi() {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropperReady, setCropperReady] = useState(false);
  const [aspect, setAspect] = useState<AspectRatio>("free");
  const [circle, setCircle] = useState(false);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [maxDimension, setMaxDimension] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sourceUrl || !imageLoaded || !imageRef.current) return;
    let cancelled = false;
    setCropperReady(false);

    void import("cropperjs")
      .then(({ default: CropperConstructor }) => {
        if (cancelled || !imageRef.current) return;
        cropperRef.current?.destroy();
        cropperRef.current = new CropperConstructor(imageRef.current, {
          aspectRatio: Number.NaN,
          autoCropArea: 0.9,
          background: false,
          checkOrientation: true,
          viewMode: 1,
          responsive: true,
          ready: () => {
            if (!cancelled) setCropperReady(true);
          },
        });
      })
      .catch((caught) => {
        if (!cancelled) setError(getImageErrorMessage(caught));
      });

    return () => {
      cancelled = true;
      cropperRef.current?.destroy();
      cropperRef.current = null;
    };
  }, [imageLoaded, sourceUrl]);

  useEffect(() => {
    return () => {
      cropperRef.current?.destroy();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function selectFile(files: File[]) {
    const selected = files[0];
    if (!selected || busy) return;
    if (selected.size > MAX_IMAGE_BYTES) {
      setError("图片不能超过 20 MB。");
      return;
    }

    cropperRef.current?.destroy();
    cropperRef.current = null;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(selected);
    objectUrlRef.current = url;
    setError(null);
    setFile(selected);
    setSourceUrl(url);
    setImageLoaded(false);
    setCropperReady(false);
    setAspect("free");
    setCircle(false);
    setFlipX(false);
    setFlipY(false);
  }

  function clearFile() {
    if (busy) return;
    cropperRef.current?.destroy();
    cropperRef.current = null;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setSourceUrl(null);
    setFile(null);
    setImageLoaded(false);
    setCropperReady(false);
    setError(null);
  }

  function setAspectRatio(value: AspectRatio) {
    setAspect(value);
    if (value !== "1") setCircle(false);
    cropperRef.current?.setAspectRatio(getAspectRatio(value, value === "1" && circle));
  }

  function toggleCircle() {
    const next = !circle;
    setCircle(next);
    if (next) setAspect("1");
    cropperRef.current?.setAspectRatio(getAspectRatio(next ? "1" : aspect, next));
  }

  function toggleFlip(axis: "x" | "y") {
    if (!cropperRef.current) return;
    if (axis === "x") {
      const next = !flipX;
      setFlipX(next);
      cropperRef.current.scaleX(next ? -1 : 1);
    } else {
      const next = !flipY;
      setFlipY(next);
      cropperRef.current.scaleY(next ? -1 : 1);
    }
  }

  async function exportImage() {
    const cropper = cropperRef.current;
    if (!cropper || !file || busy) return;
    const limit = Number(maxDimension);
    if (!Number.isFinite(limit) || limit < 0 || limit > 8192 || !Number.isInteger(limit)) {
      setError("最大边长请输入 0 到 8192 之间的整数，0 表示保持裁剪尺寸。");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const baseCanvas = cropper.getCroppedCanvas({
        fillColor: format === "jpeg" ? "#ffffff" : undefined,
      });
      if (!baseCanvas) throw new Error("无法创建裁剪画布。");
      const scale = limit > 0 ? Math.min(1, limit / Math.max(baseCanvas.width, baseCanvas.height)) : 1;
      const width = Math.max(1, Math.round(baseCanvas.width * scale));
      const height = Math.max(1, Math.round(baseCanvas.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("浏览器不支持 Canvas 导出。");
      if (format === "jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      if (circle) {
        context.beginPath();
        context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        context.clip();
      }
      context.drawImage(baseCanvas, 0, 0, width, height);

      const blob = await canvasToBlob(canvas, `image/${format}`, format === "png" ? undefined : 0.92);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(/\.[^.]+$/, "") || "image"}-裁剪.${format === "jpeg" ? "jpg" : format}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (caught) {
      setError(getImageErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        {!sourceUrl && (
          <FileDropZone
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            onFiles={selectFile}
            validate={(candidate) => /^(image\/(png|jpeg|webp))$/i.test(candidate.type) || /\.(png|jpe?g|webp)$/i.test(candidate.name)}
            title="拖入 PNG、JPG 或 WebP 图片，或 "
            hint="最大 20 MB；导出将重新编码，不保留 EXIF 等原始元数据"
          />
        )}

        {error && <ErrorBox>{error}</ErrorBox>}

        {sourceUrl && file && (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB · 本地裁剪后重新编码</div>
              </div>
              <Button variant="ghost" size="sm" disabled={busy} onClick={clearFile}>
                <X className="h-3.5 w-3.5" />
                更换图片
              </Button>
            </div>

            <div className={cn("overflow-hidden rounded-lg border border-border bg-muted/30 p-3", circle && "image-crop-circle")}>
              {!imageLoaded && <div className="grid min-h-72 place-items-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />正在读取图片…</div>}
              {/* Cropper.js needs the native image element to crop a local object URL. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={sourceUrl}
                alt="待裁剪图片"
                onLoad={() => setImageLoaded(true)}
                onError={() => setError("无法读取此图片。请尝试 PNG、JPG 或 WebP 文件。")}
                className={cn("max-h-[34rem] w-full object-contain", !imageLoaded && "hidden")}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-card p-3">
              <ToolField label="裁剪比例">
                <Segmented<AspectRatio> value={aspect} onChange={setAspectRatio} options={ASPECT_RATIOS.map(({ value, label }) => ({ value, label }))} className="max-w-full overflow-x-auto" />
              </ToolField>
              <div className="flex flex-wrap gap-2">
                <Button variant={circle ? "primary" : "outline"} size="sm" disabled={!cropperReady || busy} onClick={toggleCircle}>圆形头像遮罩</Button>
                <Button variant="outline" size="sm" disabled={!cropperReady || busy} onClick={() => cropperRef.current?.rotate(-90)}><RotateCcw className="h-3.5 w-3.5" />向左旋转</Button>
                <Button variant="outline" size="sm" disabled={!cropperReady || busy} onClick={() => cropperRef.current?.rotate(90)}><RotateCw className="h-3.5 w-3.5" />向右旋转</Button>
                <Button variant="outline" size="sm" disabled={!cropperReady || busy} onClick={() => toggleFlip("x")}><FlipHorizontal2 className="h-3.5 w-3.5" />水平翻转</Button>
                <Button variant="outline" size="sm" disabled={!cropperReady || busy} onClick={() => toggleFlip("y")}><FlipVertical2 className="h-3.5 w-3.5" />垂直翻转</Button>
              </div>
            </div>

            <div className="grid gap-4 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
              <ToolField label="导出格式">
                <Segmented<OutputFormat>
                  value={format}
                  onChange={setFormat}
                  options={[{ value: "png", label: "PNG" }, { value: "jpeg", label: "JPG" }, { value: "webp", label: "WebP" }]}
                />
              </ToolField>
              <ToolField label="最大边长" hint="0 表示原裁剪尺寸，最大 8192">
                <input
                  type="number"
                  min={0}
                  max={8192}
                  value={maxDimension}
                  onChange={(event) => setMaxDimension(event.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </ToolField>
            </div>

            <Button onClick={() => void exportImage()} disabled={!cropperReady || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              导出并下载图片
            </Button>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function getAspectRatio(aspect: AspectRatio, circle: boolean): number {
  if (circle) return 1;
  return ASPECT_RATIOS.find((option) => option.value === aspect)?.ratio ?? Number.NaN;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("图片编码失败。"));
    }, type, quality);
  });
}

function getImageErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message || "处理图片时发生未知错误。";
}
