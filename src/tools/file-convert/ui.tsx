"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ListChecks, PlayCircle } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { fetchRoutes, reachableFormats, type Routes } from "../../lib/api";
import { useJobs } from "../../lib/jobs";
import { StepSection } from "../../components/convert/section";
import { FormatGrid } from "../../components/convert/format-card";
import { DropArea } from "../../components/convert/drop-area";
import { FileList, type StagedFile } from "../../components/convert/file-list";
import { ConversionBadge } from "../../components/convert/conversion-badge";
import { JobRow } from "../../components/queue/job-row";
import { meta } from "./meta";

export default function FileConvertUi() {
  const [routes, setRoutes] = useState<Routes>({});
  const [routesErr, setRoutesErr] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [dst, setDst] = useState<string | null>(null);
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const { enqueue, jobs, downloadResult, retry, remove } = useJobs();

  useEffect(() => {
    fetchRoutes()
      .then(setRoutes)
      .catch((e) =>
        setRoutesErr(
          `无法加载转换路由 — ${e instanceof Error ? e.message : String(e)}`,
        ),
      );
  }, []);

  const sourceFormats = useMemo(() => Object.keys(routes), [routes]);
  const targetFormats = useMemo(
    () => (src ? reachableFormats(routes, src) : []),
    [routes, src],
  );

  function selectSrc(fmt: string) {
    setSrc(fmt);
    setDst(null);
    setStaged([]);
  }

  function addFiles(files: File[]) {
    setStaged((cur) => [
      ...cur,
      ...files.map((f) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file: f,
      })),
    ]);
  }

  function removeFile(id: string) {
    setStaged((cur) => cur.filter((s) => s.id !== id));
  }

  function submitAll() {
    if (!src || !dst || !staged.length) return;
    staged.forEach((s) => enqueue({ file: s.file, srcFmt: src, dstFmt: dst }));
    setStaged([]);
  }

  const recentJobs = jobs.slice(-5).reverse();

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        {routesErr && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {routesErr}。请确认后端 <code>uv run toolbox serve</code> 已启动。
          </div>
        )}

        <StepSection step={1} title="选择源格式" hint="选择你要转换的文件原始格式">
          {sourceFormats.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:bg-slate-900">
              {routesErr ? "无法获取路由" : "正在加载可用格式…"}
            </div>
          ) : (
            <FormatGrid
              formats={sourceFormats}
              selected={src}
              onSelect={selectSrc}
            />
          )}
        </StepSection>

        {src && (
          <StepSection
            step={2}
            title="选择目标格式"
            hint={`${src.toUpperCase()} 可达 ${targetFormats.length} 种格式（含多步转换）`}
          >
            {targetFormats.length === 0 ? (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                当前没有任何引擎能处理 {src.toUpperCase()} 格式
              </div>
            ) : (
              <FormatGrid formats={targetFormats} selected={dst} onSelect={setDst} />
            )}
          </StepSection>
        )}

        {src && dst && (
          <StepSection
            step={3}
            title="上传文件"
            hint="拖入或选择文件后，点击「添加到队列」开始转换"
          >
            <div className="mb-3 flex items-center justify-between">
              <ConversionBadge src={src} dst={dst} />
              <span className="text-xs text-slate-400">
                已选择 {staged.length} 个文件
              </span>
            </div>

            <DropArea acceptFmt={src} onFiles={addFiles} />
            <FileList files={staged} onRemove={removeFile} />

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
              <span className="text-xs text-slate-500" />
              <button
                onClick={submitAll}
                disabled={staged.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto dark:disabled:bg-slate-700"
              >
                <PlayCircle className="h-4 w-4" />
                添加到队列 ({staged.length})
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </StepSection>
        )}

        {recentJobs.length > 0 && (
          <StepSection
            step={4}
            title="任务"
            hint={
              <span className="inline-flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                最近 {recentJobs.length} 个任务
              </span>
            }
          >
            <div className="space-y-2">
              {recentJobs.map((j) => (
                <JobRow
                  key={j.id}
                  job={j}
                  onDownload={() => downloadResult(j.id)}
                  onRetry={() => retry(j.id)}
                  onRemove={() => remove(j.id)}
                />
              ))}
            </div>
          </StepSection>
        )}
      </div>
    </ToolShell>
  );
}
