"use client";

import { Download, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadBlob } from "../../lib/download";
import { ICON_SIZES, imageToPng, pngsToIco } from "./lib";
import { meta } from "./meta";

export default function FaviconGeneratorUi() {
  const [file, setFile] = useState<File | null>(null);
  const [background, setBackground] = useState("#ffffff");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const previewRef = useRef("");
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);
  async function makePng(size: number) {
    if (!file) return;
    setBusy(true); setError("");
    try { downloadBlob(await imageToPng(file, size, background), `favicon-${size}.png`); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "图标生成失败"); }
    finally { setBusy(false); }
  }
  async function makeIco() {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const images = await Promise.all([16, 32, 48].map(async (size) => ({ size, blob: await imageToPng(file, size, background) })));
      downloadBlob(await pngsToIco(images), "favicon.ico");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "ICO 生成失败"); }
    finally { setBusy(false); }
  }
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <FileDropZone accept="image/png,image/jpeg,image/webp" onFiles={(files) => { const next = files[0] ?? null; if (previewRef.current) URL.revokeObjectURL(previewRef.current); previewRef.current = next ? URL.createObjectURL(next) : ""; setPreviewUrl(previewRef.current); setFile(next); setError(""); }} validate={(candidate) => ["image/png", "image/jpeg", "image/webp"].includes(candidate.type) && candidate.size <= 20 * 1024 * 1024} title="拖入图片，或 " hint="PNG、JPG、WebP，最大 20 MB" />
        {file && <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
          <div className="grid aspect-square place-items-center overflow-hidden rounded-xl border border-border bg-muted/20 p-3"><img src={previewUrl} alt="图标预览" className="max-h-full max-w-full object-contain" /></div>
          <div className="space-y-4"><ToolField label="背景色" hint="透明图片可选择填充颜色"><TextField type="color" value={background} onChange={(event) => setBackground(event.target.value)} className="h-10 cursor-pointer p-1" /></ToolField><div className="flex flex-wrap gap-2">{ICON_SIZES.map((size) => <Button key={size} variant="outline" size="sm" disabled={busy} onClick={() => void makePng(size)}><Download className="h-3.5 w-3.5" />PNG {size}</Button>)}<Button size="sm" disabled={busy} onClick={() => void makeIco()}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}下载 ICO</Button></div></div>
        </div>}
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button variant="ghost" onClick={() => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); previewRef.current = ""; setPreviewUrl(""); setFile(null); setError(""); }} disabled={!file || busy}><RotateCcw className="h-3.5 w-3.5" /> 清空</Button>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">图片只在当前设备的 Canvas 中处理，不会上传。ICO 包含 16、32、48 像素 PNG 图像。</p>
      </div>
    </ToolShell>
  );
}
