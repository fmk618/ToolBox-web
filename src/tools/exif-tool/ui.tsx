"use client";

import { useState } from "react";
import { Download, ImageMinus, ShieldCheck } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { fmtSize } from "../../lib/format";
import { downloadBlob } from "../../lib/download";
import { meta } from "./meta";
import { readExif, stripMetadata, type ExifField } from "./lib";

export default function ExifToolUi() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<ExifField[]>([]);
  const [error, setError] = useState("");
  const [stripping, setStripping] = useState(false);

  async function load(files: File[]) {
    const next = files[0];
    if (!next) return;
    setFile(next); setError("");
    try { setFields(await readExif(next)); }
    catch (e) { setFields([]); setError(e instanceof Error ? e.message : "无法读取图片信息"); }
  }

  async function clear() {
    if (!file) return;
    setStripping(true); setError("");
    try {
      const { blob, extension } = await stripMetadata(file);
      const base = file.name.replace(/\.[^.]+$/, "") || "image";
      downloadBlob(blob, `${base}-clean.${extension}`);
    } catch (e) { setError(e instanceof Error ? e.message : "清除失败"); }
    finally { setStripping(false); }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        {!file ? <FileDropZone accept="image/jpeg,image/png,image/webp,image/gif,image/bmp" onFiles={load} title="拖入一张照片，或" hint="支持 JPEG / PNG / WebP / GIF / BMP · 文件只在浏览器内读取" /> : <>
          <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3"><ImageMinus className="h-5 w-5 text-muted-foreground" /><div className="min-w-0"><div className="truncate text-sm font-medium text-foreground">{file.name}</div><div className="text-xs text-muted-foreground">{file.type || "未知类型"} · {fmtSize(file.size)}</div></div><Button variant="outline" size="sm" className="ml-auto" onClick={() => { setFile(null); setFields([]); setError(""); }}>换一张</Button></section>
          {error && <ErrorBox>{error}</ErrorBox>}
          <section className="overflow-hidden rounded-xl border border-border bg-background"><div className="border-b border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground">可读取的 EXIF 信息</div>{fields.length ? <dl className="divide-y divide-border">{fields.map((field, i) => <div key={`${field.label}-${i}`} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[10rem_1fr]"><dt className="text-muted-foreground">{field.label}</dt><dd className="break-all font-mono text-foreground">{field.value}</dd></div>)}</dl> : <div className="px-4 py-8 text-center text-sm text-muted-foreground">未找到可读取的 EXIF 信息。PNG / WebP 等格式通常不含标准 JPEG EXIF，或图片已经被平台清理过。</div>}</section>
          <section className="flex flex-wrap items-center gap-3 rounded-xl border border-green-600/30 bg-green-500/10 px-4 py-3"><ShieldCheck className="h-5 w-5 text-green-700 dark:text-green-400" /><p className="min-w-0 flex-1 text-sm text-green-700 dark:text-green-400">下载新图片将通过 Canvas 重编码，只保留像素，移除 EXIF 与其他元数据。</p><Button size="sm" onClick={clear} disabled={stripping}>{stripping ? "处理中…" : <><Download className="h-4 w-4" />清除并下载</>}</Button></section>
          <p className="text-center text-[11px] text-muted-foreground">非 JPEG 图片会导出为 PNG；GIF 动图仅保留当前首帧。所有操作均在本地完成。</p>
        </>}
      </div>
    </ToolShell>
  );
}
