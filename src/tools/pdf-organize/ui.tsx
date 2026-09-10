"use client";

import {
  ArrowDown,
  ArrowUp,
  Download,
  FileText,
  GripVertical,
  Loader2,
  RotateCcw,
  RotateCw,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { ToolShell } from "../../components/tools/tool-shell";
import {
  createOrganizedPages,
  createOrganizedPdf,
  getPdfErrorMessage,
  inspectPdf,
  isPdfFile,
  movePage,
  removePage,
  rotatePage,
  type OrganizedPage,
} from "./lib";
import { meta } from "./meta";

type Activity = "loading" | "exporting" | null;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PdfOrganizeUi() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<OrganizedPage[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [activity, setActivity] = useState<Activity>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);

  async function selectFile(files: File[]) {
    const selected = files[0];
    if (!selected || activity) return;

    setError(null);
    setNotice(null);
    setFile(null);
    setPages([]);
    setTotalPages(0);
    setActivity("loading");
    try {
      const pageCount = await inspectPdf(selected);
      setFile(selected);
      setPages(createOrganizedPages(pageCount));
      setTotalPages(pageCount);
    } catch (caught) {
      setError(getPdfErrorMessage(caught));
    } finally {
      setActivity(null);
    }
  }

  function reorderPage(destinationId: string) {
    if (!draggedPageId || draggedPageId === destinationId) return;
    setPages((current) => {
      const from = current.findIndex((page) => page.id === draggedPageId);
      const to = current.findIndex((page) => page.id === destinationId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  async function downloadPdf() {
    if (!file || pages.length === 0 || activity) return;

    setActivity("exporting");
    setError(null);
    setNotice(null);
    try {
      const bytes = await createOrganizedPdf(file, pages);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${file.name.replace(/\.pdf$/i, "") || "organized"}-整理.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice("已生成并开始下载整理后的 PDF。");
    } catch (caught) {
      setError(getPdfErrorMessage(caught));
    } finally {
      setActivity(null);
    }
  }

  function clearFile() {
    if (activity) return;
    setFile(null);
    setPages([]);
    setTotalPages(0);
    setError(null);
    setNotice(null);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        {!file && (
          <FileDropZone
            accept="application/pdf,.pdf"
            onFiles={(files) => void selectFile(files)}
            validate={isPdfFile}
            title="拖入一个 PDF 文件，或 "
            hint="最多 50 MB、200 页；不支持已加密或受密码保护的 PDF"
          />
        )}

        {activity === "loading" && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在读取 PDF 页面…
          </div>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}
        {notice && (
          <div className="rounded-lg border border-green-600/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
            {notice}
          </div>
        )}

        {file && (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{file.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatSize(file.size)} · 保留 {pages.length} / {totalPages} 页
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFile} disabled={activity !== null}>
                <X className="h-3.5 w-3.5" />
                更换文件
              </Button>
            </div>

            <div className="rounded-lg border border-border">
              <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
                拖动页面调整顺序，也可使用右侧按钮旋转、移动或删除。导出会重新生成 PDF。
              </div>
              <ol className="max-h-[32rem] divide-y divide-border overflow-y-auto">
                {pages.map((page, index) => (
                  <li
                    key={page.id}
                    draggable={activity === null}
                    onDragStart={() => setDraggedPageId(page.id)}
                    onDragEnd={() => setDraggedPageId(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      reorderPage(page.id);
                      setDraggedPageId(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted font-mono text-xs">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      原第 {page.sourceIndex + 1} 页
                      {page.rotation !== 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">旋转 {page.rotation}°</span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <PageAction
                        label="向上移动"
                        disabled={activity !== null || index === 0}
                        onClick={() => setPages((current) => movePage(current, page.id, -1))}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </PageAction>
                      <PageAction
                        label="向下移动"
                        disabled={activity !== null || index === pages.length - 1}
                        onClick={() => setPages((current) => movePage(current, page.id, 1))}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </PageAction>
                      <PageAction
                        label="逆时针旋转 90 度"
                        disabled={activity !== null}
                        onClick={() => setPages((current) => rotatePage(current, page.id, -90))}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </PageAction>
                      <PageAction
                        label="顺时针旋转 90 度"
                        disabled={activity !== null}
                        onClick={() => setPages((current) => rotatePage(current, page.id, 90))}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </PageAction>
                      <PageAction
                        label="删除页面"
                        disabled={activity !== null}
                        onClick={() => setPages((current) => removePage(current, page.id))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </PageAction>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {pages.length === 0 && (
              <ErrorBox>已删除全部页面。请保留至少一页，或更换 PDF 文件。</ErrorBox>
            )}

            <Button onClick={() => void downloadPdf()} disabled={pages.length === 0 || activity !== null}>
              {activity === "exporting" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              导出并下载 PDF
            </Button>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function PageAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
