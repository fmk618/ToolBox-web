"use client";

import {
  CheckCircle2,
  CircleX,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import type { Job } from "../../lib/jobs";
import { fmtMeta } from "../../lib/formats";
import { ProgressBar } from "./progress-bar";

const STATUS_LABEL: Record<Job["status"], string> = {
  queued: "排队中",
  uploading: "上传中",
  processing: "处理中",
  done: "已完成",
  failed: "失败",
  canceled: "已取消",
};

function StatusIcon({ status }: { status: Job["status"] }) {
  switch (status) {
    case "queued":
      return <Clock className="h-4 w-4 text-slate-400" />;
    case "uploading":
      return <Upload className="h-4 w-4 animate-pulse text-blue-500" />;
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <CircleX className="h-4 w-4 text-red-500" />;
    default:
      return <Clock className="h-4 w-4 text-slate-400" />;
  }
}

export function JobRow({
  job,
  onRetry,
  onRemove,
  onDownload,
}: {
  job: Job;
  onRetry: () => void;
  onRemove: () => void;
  onDownload: () => void;
}) {
  const src = fmtMeta(job.srcFmt);
  const dst = fmtMeta(job.dstFmt);
  const elapsed = job.finishedAt
    ? ((job.finishedAt - job.startedAt) / 1000).toFixed(1) + "s"
    : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 sm:p-4 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <StatusIcon status={job.status} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {job.filename}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className={src.color}>{src.label}</span>
                <span>→</span>
                <span className={dst.color}>{dst.label}</span>
              </span>
              <span className="text-slate-300">·</span>
              <span>{(job.size / 1024).toFixed(1)} KB</span>
              {elapsed && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{elapsed}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <span className="text-xs text-slate-500">
            {STATUS_LABEL[job.status]}
            {job.status === "uploading" && ` ${job.progress}%`}
          </span>
          {job.status === "done" && (
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-900"
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </button>
          )}
          {job.status === "failed" && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              重试
            </button>
          )}
          <button
            onClick={onRemove}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="移除"
            aria-label="移除"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {(job.status === "uploading" ||
        job.status === "processing" ||
        job.status === "queued") && (
        <div className="mt-3">
          <ProgressBar percent={job.progress} status={job.status} />
        </div>
      )}

      {job.error && (
        <div className="mt-3 break-words rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {job.error}
        </div>
      )}
    </div>
  );
}
