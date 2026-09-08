"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ListChecks, PlayCircle } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { fetchRoutes, reachableFormats, type Routes } from "../../lib/api";
import { useJobs } from "../../lib/jobs";
import { StepSection } from "../../components/convert/section";
import { FormatGrid } from "../../components/convert/format-card";
import { DropArea } from "../../components/convert/drop-area";
import { FileList, type StagedFile } from "../../components/convert/file-list";
import { ConversionBadge } from "../../components/convert/conversion-badge";
import { JobRow } from "../../components/queue/job-row";
import { meta } from "./meta";

// 图片格式由「图片格式转换」工具专门处理，文件转换工具中排除
const IMAGE_FORMATS = new Set([
  "jpg", "jpeg", "png", "webp", "avif", "gif",
  "bmp", "tiff", "tif", "svg", "ico", "heic", "heif",
]);

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

  const sourceFormats = useMemo(
    () => Object.keys(routes).filter((f) => !IMAGE_FORMATS.has(f)),
    [routes],
  );
  const targetFormats = useMemo(
    () => (src ? reachableFormats(routes, src).filter((f) => !IMAGE_FORMATS.has(f)) : []),
    [routes, src],
  );

  // Step number for the task queue: only count steps that are actually rendered.
  const taskStep = 2 + (src ? 1 : 0) + (src && dst ? 1 : 0);

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
          <ErrorBox>
            {routesErr}。请确认后端 <code>uv run toolbox serve</code> 已启动。
          </ErrorBox>
        )}

        <StepSection step={1} title="选择源格式" hint="选择你要转换的文件原始格式">
          {sourceFormats.length === 0 ? (
            <div className="rounded-lg bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
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
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
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
              <span className="text-xs text-muted-foreground">
                已选择 {staged.length} 个文件
              </span>
            </div>

            <DropArea acceptFmt={src} onFiles={addFiles} />
            <FileList files={staged} onRemove={removeFile} />

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-muted-foreground" />
              <Button
                onClick={submitAll}
                disabled={staged.length === 0}
                className="w-full gap-2 px-5 py-2.5 shadow-sm sm:w-auto"
              >
                <PlayCircle className="h-4 w-4" />
                添加到队列 ({staged.length})
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </StepSection>
        )}

        {recentJobs.length > 0 && (
          <StepSection
            step={taskStep}
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
