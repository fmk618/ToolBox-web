"use client";

import type { MindElixirData, MindElixirInstance } from "mind-elixir";
import { Download, FileDown, FileUp, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { ToolShell } from "../../components/tools/tool-shell";
import { downloadBlob, downloadText } from "../../lib/download";
import { meta } from "./meta";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

function hasUnsafeHtml(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const node = value as { children?: unknown; dangerouslySetInnerHTML?: unknown };
  if (Object.prototype.hasOwnProperty.call(node, "dangerouslySetInnerHTML")) return true;
  return Array.isArray(node.children) && node.children.some(hasUnsafeHtml);
}

function isMindMapData(value: unknown): value is MindElixirData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<MindElixirData>;
  const root = data.nodeData;
  return Boolean(
    root &&
      typeof root === "object" &&
      typeof root.id === "string" &&
      typeof root.topic === "string",
  );
}

export default function MindmapUi() {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MindElixirInstance | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        const { default: MindElixir } = await import("mind-elixir");
        if (cancelled || !containerRef.current) return;
        const instance = new MindElixir({
          el: containerRef.current,
          direction: MindElixir.RIGHT,
          editable: true,
          contextMenu: true,
          toolBar: true,
          keypress: true,
          allowUndo: true,
        });
        instance.init(MindElixir.new("中心主题"));
        instanceRef.current = instance;
        setReady(true);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "思维导图加载失败。");
      }
    };

    void setup();
    return () => {
      cancelled = true;
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  const resetMindmap = async () => {
    const instance = instanceRef.current;
    if (!instance) return;
    const { default: MindElixir } = await import("mind-elixir");
    instance.refresh(MindElixir.new("中心主题"));
    instance.clearHistory?.();
    setError("");
  };

  const exportJson = () => {
    const instance = instanceRef.current;
    if (!instance) return;
    downloadText(instance.getDataString(), "思维导图.mindmap.json", "application/json;charset=utf-8");
  };

  const exportImage = async (format: "svg" | "png") => {
    const instance = instanceRef.current;
    if (!instance) return;
    try {
      const blob = format === "svg" ? instance.exportSvg() : await instance.exportPng();
      if (blob) downloadBlob(blob, `思维导图.${format}`);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出失败。");
    }
  };

  const importMindmap = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const instance = instanceRef.current;
    if (!file || !instance) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("文件过大，请选择 10 MB 以内的思维导图快照。");
      return;
    }

    try {
      const data: unknown = JSON.parse(await file.text());
      if (!isMindMapData(data)) throw new Error("文件不是有效的思维导图快照。");
      if (hasUnsafeHtml(data.nodeData)) {
        throw new Error("不支持包含自定义 HTML 的思维导图节点。");
      }
      instance.refresh(data);
      instance.clearHistory?.();
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取思维导图快照。");
    }
  };

  return (
    <ToolShell
      icon={meta.icon}
      title={meta.name}
      description={meta.description}
      local
      wide
    >
      <div className="flex h-[calc(100dvh-13rem)] min-h-[460px] flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={importMindmap}
            className="sr-only"
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={!ready}>
            <FileUp className="h-3.5 w-3.5" />
            导入快照
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson} disabled={!ready}>
            <FileDown className="h-3.5 w-3.5" />
            导出 JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportImage("svg")} disabled={!ready}>
            <Download className="h-3.5 w-3.5" />
            SVG
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportImage("png")} disabled={!ready}>
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={() => void resetMindmap()} disabled={!ready}>
            <RotateCcw className="h-3.5 w-3.5" />
            新建导图
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {ready ? "本地处理 · 不自动保存" : "正在加载思维导图…"}
          </span>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-background" />
      </div>
    </ToolShell>
  );
}
