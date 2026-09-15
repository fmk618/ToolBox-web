"use client";

import { AudioLines, Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { TextField } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { cancelMediaJob, downloadMediaJob, pollMediaJob, submitMediaJob, type MediaJobStatusResponse } from "../../lib/api";
import { meta } from "./meta";

type SourceMode = "file" | "url";
type OutputFormat = "mp3" | "wav" | "m4a" | "aac" | "flac";
type Bitrate = "96k" | "128k" | "192k" | "256k" | "320k";

const JOB_PATH = "/tools/audio-convert/jobs";
const MAX_BYTES = 200 * 1024 * 1024;

export default function AudioConvertUi() {
  const [mode, setMode] = useState<SourceMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<OutputFormat>("mp3");
  const [bitrate, setBitrate] = useState<Bitrate>("192k");
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
        if (next.status === "done" || next.status === "failed" || next.status === "cancelled") setBusy(false);
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

  function selectFile(files: File[]) {
    const candidate = files[0];
    if (!candidate) return;
    if (candidate.size > MAX_BYTES) {
      setError("媒体文件不能超过 200 MB。");
      return;
    }
    setFile(candidate);
    setError(null);
  }

  async function start() {
    if (busy) return;
    if (mode === "file" && !file) {
      setError("请选择音频或视频文件。");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("请输入媒体网址。");
      return;
    }
    setError(null);
    setBusy(true);
    setJob(null);
    try {
      const response = await submitMediaJob(
        JOB_PATH,
        mode === "file" ? file : null,
        {
          ...(mode === "url" ? { url: url.trim() } : {}),
          options: JSON.stringify({ output_format: format, bitrate, sample_rate: "source", channels: "source" }),
        },
      );
      setJobId(response.job_id);
      setJob(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "提交转换任务失败。");
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
      const result = await downloadMediaJob(JOB_PATH, jobId, `converted.${format}`);
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
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <AudioLines className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p></div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={busy}><X className="h-4 w-4" />更换</Button>
              </div>
            ) : (
              <FileDropZone
                accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.flac,.mp4,.mov,.webm,.mkv"
                onFiles={selectFile}
                validate={(candidate) => candidate.size <= MAX_BYTES && (/^(audio|video)\//i.test(candidate.type) || /\.(mp3|wav|m4a|aac|flac|mp4|mov|webm|mkv)$/i.test(candidate.name))}
                title="拖入音频或视频文件，或 "
                hint="最大 200 MB；复杂处理会在服务器上执行"
              />
            )
          ) : (
            <TextField value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/video.mp4" inputMode="url" disabled={busy} />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <ToolField label="输出格式"><select value={format} onChange={(event) => setFormat(event.target.value as OutputFormat)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none">{["mp3", "wav", "m4a", "aac", "flac"].map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></ToolField>
            <ToolField label="音频码率" hint="WAV/FLAC 不使用"><select value={bitrate} onChange={(event) => setBitrate(event.target.value as Bitrate)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none">{["96k", "128k", "192k", "256k", "320k"].map((value) => <option key={value}>{value}</option>)}</select></ToolField>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void start()} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <AudioLines className="h-4 w-4" />}{busy ? "处理中…" : "开始转换"}</Button>
            {busy && <Button variant="outline" onClick={() => void cancel()}><X className="h-4 w-4" />取消</Button>}
          </div>
          <p className="text-xs text-muted-foreground">上传文件或媒体网址会发送到后端；网址来源必须通过服务器安全校验。</p>
        </section>

        {error && <ErrorBox>{error}</ErrorBox>}
        {job && <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-live="polite"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="text-sm font-medium">任务状态：{statusLabel(job.status)}</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand transition-all" style={{ width: `${job.progress}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">{job.progress}%{job.error ? ` · ${job.error}` : ""}</p></div>{job.status === "done" && <Button size="sm" onClick={() => void download()}><Download className="h-4 w-4" />下载结果</Button>}</div></section>}
      </div>
    </ToolShell>
  );
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function statusLabel(status: string): string {
  return ({ queued: "排队中", processing: "处理中", done: "已完成", failed: "失败", cancelled: "已取消" } as Record<string, string>)[status] ?? status;
}
