"use client";

import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import {
  Excalidraw,
  exportToBlob,
  exportToSvg,
  restore,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import { Download, FileDown, FileUp } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { ToolShell } from "../../components/tools/tool-shell";
import { downloadBlob, downloadText } from "../../lib/download";
import { meta } from "./meta";

const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

export default function WhiteboardUi() {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const importScene = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !api) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("文件过大，请选择 20 MB 以内的 Excalidraw 文件。");
      return;
    }

    try {
      const data: unknown = JSON.parse(await file.text());
      if (!data || typeof data !== "object" || !Array.isArray((data as { elements?: unknown }).elements)) {
        throw new Error("文件不是有效的 Excalidraw 场景。");
      }
      const restored = restore(
        data as Parameters<typeof restore>[0],
        api.getAppState(),
        api.getSceneElementsIncludingDeleted(),
      );
      api.updateScene({ elements: restored.elements, appState: restored.appState });
      if (Object.keys(restored.files).length > 0) api.addFiles(Object.values(restored.files));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取 Excalidraw 文件。");
    }
  };

  const exportJson = () => {
    if (!api) return;
    downloadText(
      serializeAsJSON(
        api.getSceneElementsIncludingDeleted(),
        api.getAppState(),
        api.getFiles(),
        "local",
      ),
      "白板.excalidraw",
      "application/json;charset=utf-8",
    );
  };

  const exportImage = async (format: "png" | "svg") => {
    if (!api) return;
    try {
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();
      if (format === "png") {
        const blob = await exportToBlob({
          elements,
          appState,
          files,
          mimeType: "image/png",
          exportPadding: 16,
        });
        downloadBlob(blob, "白板.png");
      } else {
        const svg = await exportToSvg({ elements, appState, files, exportPadding: 16 });
        downloadBlob(
          new Blob([svg.outerHTML], { type: "image/svg+xml;charset=utf-8" }),
          "白板.svg",
        );
      }
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出失败。");
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
          <input
            ref={inputRef}
            type="file"
            accept=".excalidraw,.json,application/json"
            onChange={importScene}
            className="sr-only"
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-3.5 w-3.5" />
            导入场景
          </Button>
          <Button variant="outline" size="sm" onClick={exportJson} disabled={!api}>
            <FileDown className="h-3.5 w-3.5" />
            导出 JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportImage("png")} disabled={!api}>
            <Download className="h-3.5 w-3.5" />
            PNG
          </Button>
          <Button variant="outline" size="sm" onClick={() => void exportImage("svg")} disabled={!api}>
            <Download className="h-3.5 w-3.5" />
            SVG
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">本地处理 · 不自动保存</span>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div className="h-[min(72vh,48rem)] min-h-[32rem] overflow-hidden rounded-2xl border border-border bg-white">
          <Excalidraw
            excalidrawAPI={setApi}
            initialData={{
              appState: { viewBackgroundColor: "#ffffff" },
            }}
            UIOptions={{
              canvasActions: {
                loadScene: false,
                saveToActiveFile: false,
                export: false,
              },
            }}
          />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          白板编辑器由 Excalidraw 提供；编辑器内的版权与归属信息保持显示。导入仅接受本地文件，最大 20 MB。
        </p>
      </div>
    </ToolShell>
  );
}
