"use client";

import { Loader2, Search, Subtitles, Video } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { extractVideoCaptions, extractVideoMetadata, type CaptionsResponse, type VideoMetadataResponse } from "../../lib/api";
import { meta } from "./meta";

export default function VideoExtractUi() {
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadataResponse | null>(null);
  const [captions, setCaptions] = useState<CaptionsResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function extract() {
    const value = url.trim();
    if (!value) {
      setError("请输入视频网址。");
      return;
    }
    setBusy(true);
    setError(null);
    setMetadata(null);
    setCaptions(null);
    try {
      const [nextMetadata, nextCaptions] = await Promise.all([
        extractVideoMetadata(value),
        extractVideoCaptions(value),
      ]);
      setMetadata(nextMetadata);
      setCaptions(nextCaptions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "视频解析失败。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <ToolField label="视频网址" hint="当前支持 HTTPS YouTube 链接">
            <div className="flex flex-col gap-2 sm:flex-row">
              <TextField
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void extract();
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                inputMode="url"
                autoComplete="url"
                disabled={busy}
              />
              <Button onClick={() => void extract()} disabled={busy || !url.trim()} className="shrink-0">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {busy ? "解析中…" : "开始解析"}
              </Button>
            </div>
          </ToolField>
          <p className="mt-3 text-xs text-muted-foreground">
            网址会发送到后端进行解析；不会在浏览器中直接抓取视频。字幕转写结果来自站点已有字幕，不是音频识别。
          </p>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        {metadata && (
          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label="视频信息">
            <div className="flex flex-col gap-4 p-4 sm:flex-row">
              {metadata.metadata.thumbnail_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={metadata.metadata.thumbnail_url}
                  alt="视频缩略图"
                  className="aspect-video w-full rounded-lg object-cover sm:w-56"
                />
              ) : (
                <div className="grid aspect-video w-full place-items-center rounded-lg bg-muted sm:w-56"><Video className="h-8 w-8 text-muted-foreground" /></div>
              )}
              <div className="min-w-0 space-y-2">
                <h2 className="text-lg font-semibold">{metadata.metadata.title || "未提供标题"}</h2>
                <p className="text-sm text-muted-foreground">{metadata.metadata.author || "未知作者"}</p>
                <p className="text-xs text-muted-foreground">来源：{metadata.metadata.provider} · ID：{metadata.metadata.video_id}</p>
                {metadata.warnings.map((warning) => <p key={warning} className="text-xs text-amber-700 dark:text-amber-300">{warning}</p>)}
              </div>
            </div>
          </section>
        )}

        {captions && (
          <section className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="视频字幕">
            <div className="flex items-center gap-2">
              <Subtitles className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">字幕与转写</h2>
              {captions.language_code && <span className="text-xs text-muted-foreground">{captions.language_code}{captions.is_generated ? " · 自动生成" : ""}</span>}
            </div>
            {captions.transcript ? (
              <>
                <pre className="max-h-[30rem] overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm leading-6">{captions.transcript}</pre>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {captions.segments.slice(0, 300).map((segment, index) => (
                    <div key={`${segment.start}-${index}`} className="flex gap-3 rounded px-2 py-1 hover:bg-muted">
                      <span className="w-20 shrink-0 font-mono">{formatTime(segment.start)}</span>
                      <span>{segment.text}</span>
                    </div>
                  ))}
                  {captions.segments.length > 300 && <p>仅展示前 300 段，完整内容请复制上方转写文本。</p>}
                </div>
              </>
            ) : (
              <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{captions.warnings[0] ?? "没有可用字幕。"}</p>
            )}
          </section>
        )}
      </div>
    </ToolShell>
  );
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
  const secs = (total % 60).toString().padStart(2, "0");
  return hours ? `${hours}:${minutes}:${secs}` : `${minutes}:${secs}`;
}
