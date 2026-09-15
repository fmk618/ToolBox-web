"use client";

import { Download, Film, Loader2, Scissors, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { TextField } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { cancelMediaJob, downloadMediaJob, pollMediaJob, submitMediaJob, type MediaJobStatusResponse } from "../../lib/api";
import { meta } from "./meta";

type SourceMode = "file" | "url";
type Action = "crop" | "trim";

const JOB_PATH = "/tools/video-edit/jobs";
const MAX_BYTES = 200 * 1024 * 1024;

export default function VideoEditUi() {
  const [mode, setMode] = useState<SourceMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [action, setAction] = useState<Action>("crop");
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [width, setWidth] = useState("1");
  const [height, setHeight] = useState("1");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<MediaJobStatusResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;
    const currentJobId = jobId;
    let stopped = false;
    async function check() {
      try {
        const next = await pollMediaJob(JOB_PATH, currentJobId);
        if (stopped) return;
        setJob(next);
        if (["done", "failed", "cancelled"].includes(next.status)) setBusy(false);
      } catch (caught) {
        if (!stopped) {
          setError(caught instanceof Error ? caught.message : "无法获取任务状态。");
          setBusy(false);
        }
      }
    }
    void check();
    const timer = window.setInterval(() => void check(), 1500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [jobId]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function clearFile() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setFile(null);
    setDuration(null);
  }

  function selectFile(files: File[]) {
    const candidate = files[0];
    if (!candidate) return;
    if (candidate.size > MAX_BYTES) {
      setError("视频文件不能超过 200 MB。");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const objectUrl = URL.createObjectURL(candidate);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setFile(candidate);
    setMode("file");
    setError(null);
  }

  function parseNumber(value: string, label: string, minimum: number, maximum: number): number | null {
    const number = Number(value);
    if (!Number.isFinite(number) || number < minimum || number > maximum) {
      setError(`${label}必须在 ${minimum} 到 ${maximum} 之间。`);
      return null;
    }
    return number;
  }

  async function startJob() {
    if (busy) return;
    if (mode === "file" && !file) {
      setError("请选择视频文件。");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("请输入视频网址。");
      return;
    }
    const crop = {
      x: parseNumber(x, "X", 0, 1),
      y: parseNumber(y, "Y", 0, 1),
      width: parseNumber(width, "宽度", 0.01, 1),
      height: parseNumber(height, "高度", 0.01, 1),
    };
    if (Object.values(crop).some((value) => value === null)) return;
    if (action === "crop" && (crop.x! + crop.width! > 1 || crop.y! + crop.height! > 1)) {
      setError("裁剪区域不能超出视频范围。");
      return;
    }
    const startValue = parseNumber(start, "开始时间", 0, 86_400);
    if (startValue === null) return;
    const endValue = end.trim() ? parseNumber(end, "结束时间", 0.01, 86_400) : null;
    if (end.trim() && endValue === null) return;
    if (endValue !== null && endValue <= startValue) {
      setError("结束时间必须大于开始时间。");
      return;
    }

    setBusy(true);
    setError(null);
    setJob(null);
    try {
      const response = await submitMediaJob(
        JOB_PATH,
        mode === "file" ? file : null,
        {
          ...(mode === "url" ? { url: url.trim() } : {}),
          options: JSON.stringify({ action, ...crop, start: startValue, end: endValue }),
        },
      );
      setJobId(response.job_id);
      setJob(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "提交视频编辑任务失败。");
      setBusy(false);
    }
  }

  async function cancel() {
    if (!jobId) return;
    try {
      await cancelMediaJob(JOB_PATH, jobId);
      setJob((current) => current ? { ...current, status: "cancelled" } : current);
      setBusy(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "取消任务失败。");
    }
  }

  async function download() {
    if (!jobId || !job || job.status !== "done") return;
    try {
      const result = await downloadMediaJob(JOB_PATH, jobId, "edited.mp4");
      const objectUrl = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = result.filename;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
      setJobId(null);
      setJob(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "下载结果失败。");
    }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <ToolField label="输入来源">
            <Segmented<SourceMode> value={mode} onChange={(value) => { setMode(value); setError(null); }} options={[{ value: "file", label: "上传文件" }, { value: "url", label: "媒体网址" }]} />
          </ToolField>
          {mode === "file" ? (
            file ? (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"><Film className="h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p></div><Button variant="ghost" size="sm" onClick={clearFile} disabled={busy}><X className="h-4 w-4" />更换</Button></div>
            ) : (
              <FileDropZone accept="video/*,.mp4,.mov,.webm,.mkv,.avi" onFiles={selectFile} validate={(candidate) => candidate.size <= MAX_BYTES && (/^video\//i.test(candidate.type) || /\.(mp4|mov|webm|mkv|avi)$/i.test(candidate.name))} title="拖入视频文件，或 " hint="最大 200 MB；输出统一为 MP4" />
            )
          ) : (
            <TextField value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/video.mp4" inputMode="url" disabled={busy} />
          )}
          {previewUrl ? <div className="overflow-hidden rounded-lg border border-border bg-black"><video src={previewUrl} controls className="max-h-[26rem] w-full" onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} /></div> : mode === "url" && <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">远程视频将在服务器安全下载后处理，浏览器不会直接抓取该网址。</p>}
          {duration !== null && Number.isFinite(duration) && <p className="text-xs text-muted-foreground">视频时长：{formatTime(duration)}</p>}
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <ToolField label="编辑操作"><Segmented<Action> value={action} onChange={setAction} options={[{ value: "crop", label: "裁剪画面" }, { value: "trim", label: "剪辑时间" }]} /></ToolField>
          {action === "crop" && <div className="grid gap-3 sm:grid-cols-4"><NumberField label="X 起点" value={x} onChange={setX} max={1} /><NumberField label="Y 起点" value={y} onChange={setY} max={1} /><NumberField label="宽度" value={width} onChange={setWidth} max={1} /><NumberField label="高度" value={height} onChange={setHeight} max={1} /></div>}
          <div className="grid gap-3 sm:grid-cols-2"><NumberField label="开始时间（秒）" value={start} onChange={setStart} max={86400} /><NumberField label="结束时间（秒，可选）" value={end} onChange={setEnd} max={86400} /></div>
          {action === "crop" && <p className="text-xs text-muted-foreground">裁剪坐标使用 0 到 1 的比例，例如 X=0.1、宽度=0.8 表示去掉左右各 10%。</p>}
          <div className="flex flex-wrap gap-2"><Button onClick={() => void startJob()} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}{busy ? "处理中…" : "开始处理"}</Button>{busy && <Button variant="outline" onClick={() => void cancel()}><X className="h-4 w-4" />取消</Button>}</div>
          <p className="text-xs text-muted-foreground">文件或网址会发送到后端；服务器只接受预设编辑参数，不执行用户提交的 FFmpeg 命令。</p>
        </section>

        {error && <ErrorBox>{error}</ErrorBox>}
        {job && <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-live="polite"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">任务状态：{statusLabel(job.status)}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${job.progress}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{job.progress}%{job.error ? ` · ${job.error}` : ""}</p></div>{job.status === "done" && <Button size="sm" onClick={() => void download()}><Download className="h-4 w-4" />下载 MP4</Button>}</div></section>}
      </div>
    </ToolShell>
  );
}

function NumberField({ label, value, onChange, max }: { label: string; value: string; onChange: (value: string) => void; max: number }) {
  return <ToolField label={label}><TextField type="number" min={0} max={max} step="0.01" value={value} onChange={(event) => onChange(event.target.value)} /></ToolField>;
}

function formatBytes(bytes: number): string { return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function formatTime(seconds: number): string { const total = Math.max(0, Math.floor(seconds)); const minutes = Math.floor(total / 60).toString().padStart(2, "0"); const secs = (total % 60).toString().padStart(2, "0"); return `${minutes}:${secs}`; }
function statusLabel(status: string): string { return ({ queued: "排队中", processing: "处理中", done: "已完成", failed: "失败", cancelled: "已取消" } as Record<string, string>)[status] ?? status; }
