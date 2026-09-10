"use client";

import { CheckSquare, Download, Eye, FileArchive, ImageDown, Loader2, RotateCcw, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import {
  MAX_EXPORT_FRAMES,
  createContactSheet,
  createFramesZip,
  formatGifDuration,
  frameDownloadName,
  gifDownloadBaseName,
  inspectGif,
  isGifFile,
  renderGifFrames,
  type GifInfo,
  type RenderedGifFrame,
} from "./lib";
import { meta } from "./meta";

export default function GifFramesUi() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<GifInfo | null>(null);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selected = useMemo(() => new Set(selectedIndexes), [selectedIndexes]);
  const currentFrame = previewIndex === null ? null : info?.frames[previewIndex] ?? null;

  async function load(files: File[]) {
    const nextFile = files[0];
    if (!nextFile) return;
    setBusy(true);
    setError(null);
    setFile(null);
    setInfo(null);
    setSelectedIndexes([]);
    setPreviewIndex(null);
    setPreviewUrl(null);
    try {
      const nextInfo = await inspectGif(nextFile);
      setFile(nextFile);
      setInfo(nextInfo);
      setSelectedIndexes([0]);
      await previewFrame(nextInfo, 0);
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setBusy(false);
    }
  }

  async function previewFrame(target: GifInfo, index: number) {
    const [rendered] = await renderGifFrames(target, [index]);
    setPreviewUrl(URL.createObjectURL(rendered.blob));
    setPreviewIndex(index);
  }

  async function choosePreview(index: number) {
    if (!info) return;
    setBusy(true);
    setError(null);
    try {
      await previewFrame(info, index);
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setBusy(false);
    }
  }

  function toggleFrame(index: number) {
    setSelectedIndexes((current) => current.includes(index)
      ? current.filter((value) => value !== index)
      : [...current, index].sort((left, right) => left - right));
  }

  function selectFirstFrames() {
    if (!info) return;
    setSelectedIndexes(Array.from({ length: Math.min(info.frames.length, MAX_EXPORT_FRAMES) }, (_, index) => index));
  }

  function clearSelection() {
    setSelectedIndexes([]);
  }

  async function renderSelected(): Promise<RenderedGifFrame[] | null> {
    if (!info || !selectedIndexes.length) {
      setError("请至少选择一帧。");
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      return await renderGifFrames(info, selectedIndexes);
    } catch (caught) {
      setError(messageFrom(caught));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function downloadCurrent() {
    if (!info || previewIndex === null) return;
    setBusy(true);
    setError(null);
    try {
      const [rendered] = await renderGifFrames(info, [previewIndex]);
      downloadBlob(rendered.blob, `${gifDownloadBaseName(file?.name ?? "gif-frames")}-${frameDownloadName(previewIndex)}`);
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setBusy(false);
    }
  }

  async function downloadZip() {
    if (!file || selectedIndexes.length < 2) return;
    const rendered = await renderSelected();
    if (!rendered) return;
    setBusy(true);
    try {
      const zip = await createFramesZip(rendered);
      downloadBlob(zip, `${gifDownloadBaseName(file.name)}-frames.zip`);
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setBusy(false);
    }
  }

  async function downloadContactSheet() {
    if (!file || !info) return;
    const rendered = await renderSelected();
    if (!rendered) return;
    setBusy(true);
    try {
      const sheet = await createContactSheet(info, rendered);
      downloadBlob(sheet, `${gifDownloadBaseName(file.name)}-contact-sheet.png`);
    } catch (caught) {
      setError(messageFrom(caught));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setInfo(null);
    setSelectedIndexes([]);
    setPreviewIndex(null);
    setPreviewUrl(null);
    setError(null);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          GIF 仅在当前浏览器内解码，不会上传或保存。最大 20 MB、800 万像素、300 帧；一次最多导出 {MAX_EXPORT_FRAMES} 帧。导出的 PNG 会重新编码，不保留原文件元数据。
        </div>

        {!info && (
          <FileDropZone
            accept="image/gif,.gif"
            validate={isGifFile}
            onFiles={(files) => void load(files)}
            title="拖入 GIF 动图，或"
            hint="支持本地 GIF · 最大 20 MB · 会正确处理动画的帧处置方式"
          />
        )}

        {busy && !info && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />正在读取 GIF 帧…
          </div>
        )}

        {info && file && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card p-3 text-sm">
              <span className="max-w-full truncate font-medium text-foreground">{file.name}</span>
              <span className="text-muted-foreground">{info.width} × {info.height}</span>
              <span className="text-muted-foreground">{info.frames.length} 帧</span>
              <span className="text-muted-foreground">{formatGifDuration(info.durationMs)}</span>
              <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={reset} disabled={busy}>
                <RotateCcw className="h-3.5 w-3.5" />换一个 GIF
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section className="space-y-3 rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium text-foreground">当前帧预览</h2>
                  {previewIndex !== null && <span className="text-xs text-muted-foreground">第 {previewIndex + 1} / {info.frames.length} 帧</span>}
                </div>
                <div className="grid min-h-64 place-items-center overflow-auto rounded-lg bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%),linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%,transparent_75%,hsl(var(--muted))_75%)] bg-[size:20px_20px] bg-[position:0_0,10px_10px] p-3">
                  {previewUrl && (
                    // The preview is a transient local PNG object URL produced from the selected GIF frame.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt={previewIndex === null ? "GIF 帧预览" : `GIF 第 ${previewIndex + 1} 帧`} className="max-h-[30rem] max-w-full object-contain" />
                  )}
                </div>
                {currentFrame && (
                  <p className="text-xs text-muted-foreground">
                    延迟 {formatGifDuration(currentFrame.delay * 10)} · 帧处置：{disposalLabel(currentFrame.disposalType)}
                  </p>
                )}
                <Button onClick={() => void downloadCurrent()} disabled={busy || previewIndex === null}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}下载当前帧 PNG
                </Button>
              </section>

              <aside className="space-y-3 rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-medium text-foreground">选择导出帧</h2>
                  <span className="text-xs text-muted-foreground">{selectedIndexes.length} / {MAX_EXPORT_FRAMES}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={selectFirstFrames} disabled={busy}>
                    <CheckSquare className="h-3.5 w-3.5" />前 {Math.min(info.frames.length, MAX_EXPORT_FRAMES)} 帧
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection} disabled={busy || !selectedIndexes.length}>
                    <Square className="h-3.5 w-3.5" />取消选择
                  </Button>
                </div>
                <div className="max-h-[33rem] divide-y divide-border overflow-y-auto rounded-lg border border-border">
                  {info.frames.map((frame, index) => (
                    <div key={index} className="flex items-center gap-2 px-2 py-2 text-xs">
                      <input
                        type="checkbox"
                        checked={selected.has(index)}
                        disabled={busy || (!selected.has(index) && selectedIndexes.length >= MAX_EXPORT_FRAMES)}
                        onChange={() => toggleFrame(index)}
                        aria-label={`选择第 ${index + 1} 帧`}
                        className="h-3.5 w-3.5 accent-foreground"
                      />
                      <button type="button" onClick={() => void choosePreview(index)} disabled={busy} className="min-w-0 flex-1 truncate text-left text-foreground hover:underline disabled:no-underline">
                        第 {index + 1} 帧
                      </button>
                      <span className="shrink-0 text-muted-foreground">{formatGifDuration(frame.delay * 10)}</span>
                      <button type="button" onClick={() => void choosePreview(index)} disabled={busy} aria-label={`预览第 ${index + 1} 帧`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            <ToolField label="批量导出" hint="多帧 ZIP 与联系表均使用已选帧；最多 30 帧、PNG 总大小最多 100 MB。">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void downloadZip()} disabled={busy || selectedIndexes.length < 2}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}导出所选帧 ZIP
                </Button>
                <Button variant="outline" onClick={() => void downloadContactSheet()} disabled={busy || !selectedIndexes.length}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}导出联系表 PNG
                </Button>
              </div>
            </ToolField>
          </>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}
      </div>
    </ToolShell>
  );
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function disposalLabel(disposalType: number): string {
  if (disposalType === 2) return "恢复背景";
  if (disposalType === 3) return "恢复上一帧";
  return "保留";
}
