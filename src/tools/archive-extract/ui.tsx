"use client";

import { Download, Eye, FileArchive, FileText, Loader2, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { ToolShell } from "../../components/tools/tool-shell";
import {
  extractArchiveEntry,
  formatBytes,
  getDownloadName,
  inspectArchive,
  isPreviewableText,
  isSupportedArchive,
  type ArchiveEntry,
  type ArchiveInfo,
} from "./lib";
import { meta } from "./meta";

type Preview = { name: string; content: string } | null;

export default function ArchiveExtractUi() {
  const [file, setFile] = useState<File | null>(null);
  const [archive, setArchive] = useState<ArchiveInfo | null>(null);
  const [busyEntryId, setBusyEntryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [preview, setPreview] = useState<Preview>(null);

  async function selectArchive(files: File[]) {
    const selected = files[0];
    if (!selected || loading || busyEntryId) return;

    setError(null);
    setPreview(null);
    setFile(null);
    setArchive(null);
    setFilter("");
    setLoading(true);
    try {
      const info = await inspectArchive(selected);
      setFile(selected);
      setArchive(info);
    } catch (caught) {
      setError(getArchiveErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  async function downloadEntry(entry: ArchiveEntry) {
    if (!file || !archive || busyEntryId || !canExtract(entry)) return;
    setBusyEntryId(entry.id);
    setError(null);
    try {
      const bytes = await extractArchiveEntry(file, archive.format, entry);
      const blob = new Blob([bytes as BlobPart], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getDownloadName(entry);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (caught) {
      setError(getArchiveErrorMessage(caught));
    } finally {
      setBusyEntryId(null);
    }
  }

  async function showPreview(entry: ArchiveEntry) {
    if (!file || !archive || busyEntryId || !isPreviewableText(entry) || !canExtract(entry)) return;
    setBusyEntryId(entry.id);
    setError(null);
    try {
      const bytes = await extractArchiveEntry(file, archive.format, entry);
      setPreview({
        name: entry.safePath ?? entry.rawName,
        content: new TextDecoder("utf-8", { fatal: false }).decode(bytes),
      });
    } catch (caught) {
      setError(getArchiveErrorMessage(caught));
    } finally {
      setBusyEntryId(null);
    }
  }

  function clearArchive() {
    if (loading || busyEntryId) return;
    setFile(null);
    setArchive(null);
    setError(null);
    setFilter("");
    setPreview(null);
  }

  const entries = useMemo(() => {
    if (!archive) return [];
    const query = filter.trim().toLocaleLowerCase();
    if (!query) return archive.entries;
    return archive.entries.filter((entry) =>
      (entry.safePath ?? entry.rawName).toLocaleLowerCase().includes(query),
    );
  }, [archive, filter]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        {!file && (
          <FileDropZone
            accept=".zip,.gz,.tgz,application/zip,application/gzip"
            onFiles={(files) => void selectArchive(files)}
            validate={isSupportedArchive}
            title="拖入 ZIP、GZIP 或 TGZ 文件，或 "
            hint="仅在浏览器本地查看和解压；不支持 RAR、7z、加密 ZIP 或 ZIP64"
          />
        )}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在读取压缩包目录…
          </div>
        )}
        {error && <ErrorBox>{error}</ErrorBox>}

        {file && archive && (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted">
                <FileArchive className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {archive.format === "zip" ? "ZIP" : "GZIP"} · {formatBytes(file.size)} · {archive.entries.length} 个条目
                </div>
              </div>
              <Button variant="ghost" size="sm" disabled={busyEntryId !== null} onClick={clearArchive}>
                <X className="h-3.5 w-3.5" />
                更换文件
              </Button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="筛选条目路径"
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                解压时只处理所选单个条目；包含不安全路径、加密或不支持算法的条目不可下载。
              </div>
              <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
                {entries.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 px-3 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-sm" title={entry.safePath ?? entry.rawName}>
                        {(entry.safePath ?? entry.rawName) || "（无效文件名）"}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {entry.directory
                          ? "目录"
                          : entry.originalSize > 0
                            ? `${formatBytes(entry.originalSize)} · 压缩后 ${formatBytes(entry.compressedSize)}`
                            : archive.format === "gzip"
                              ? "解压大小将在下载时确定"
                              : "空文件"}
                        {!canExtract(entry) && ` · ${getEntryBlockReason(entry)}`}
                      </div>
                    </div>
                    {!entry.directory && (
                      <div className="flex shrink-0 items-center gap-1">
                        {isPreviewableText(entry) && canExtract(entry) && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyEntryId !== null}
                            onClick={() => void showPreview(entry)}
                          >
                            {busyEntryId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                            预览
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canExtract(entry) || busyEntryId !== null}
                          onClick={() => void downloadEntry(entry)}
                        >
                          {busyEntryId === entry.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                          下载
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
                {entries.length === 0 && (
                  <li className="px-3 py-8 text-center text-sm text-muted-foreground">没有匹配的条目。</li>
                )}
              </ul>
            </div>

            {preview && (
              <section className="overflow-hidden rounded-lg border border-border">
                <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
                  <div className="truncate text-sm font-medium">预览：{preview.name}</div>
                  <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                    <X className="h-3.5 w-3.5" />
                    关闭
                  </Button>
                </div>
                <pre className="max-h-96 overflow-auto bg-muted/30 p-3 text-xs leading-5 whitespace-pre-wrap break-words">
                  {preview.content}
                </pre>
              </section>
            )}
          </>
        )}
      </div>
    </ToolShell>
  );
}

function canExtract(entry: ArchiveEntry): boolean {
  return (
    !entry.directory &&
    Boolean(entry.safePath) &&
    !entry.encrypted &&
    (entry.compression === 0 || entry.compression === 8)
  );
}

function getEntryBlockReason(entry: ArchiveEntry): string {
  if (!entry.safePath) return "不安全路径";
  if (entry.encrypted) return "已加密";
  if (entry.compression !== 0 && entry.compression !== 8) return "不支持的压缩算法";
  return "不可下载";
}

function getArchiveErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid|unexpected|corrupt|inflate|zip/i.test(message)) {
    return `无法安全读取该压缩包：${message}`;
  }
  return message || "处理压缩包时发生未知错误。";
}
