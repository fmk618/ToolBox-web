"use client";

import type { createUniver } from "@univerjs/presets";
import type { IWorkbookData } from "@univerjs/core";
import { FileDown, FileUp, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import { meta } from "./meta";

type UniverRuntime = ReturnType<typeof createUniver>;

const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

function createInitialSnapshot(): Partial<IWorkbookData> {
  return {
    id: `workbook-${Date.now()}`,
    name: "工作簿",
  };
}

function isWorkbookSnapshot(value: unknown): value is Partial<IWorkbookData> {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<IWorkbookData> & { sheets?: unknown; sheetOrder?: unknown };
  return (
    typeof snapshot.id === "string" &&
    typeof snapshot.name === "string" &&
    Array.isArray(snapshot.sheetOrder) &&
    Boolean(snapshot.sheets && typeof snapshot.sheets === "object")
  );
}

export default function SpreadsheetUi() {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<UniverRuntime | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        const [{ createUniver }, { UniverSheetsCorePreset }] = await Promise.all([
          import("@univerjs/presets"),
          import("@univerjs/preset-sheets-core"),
        ]);
        if (cancelled || !containerRef.current) return;
        const runtime = createUniver({
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
            }),
          ],
        });
        runtime.univerAPI.createWorkbook(createInitialSnapshot());
        runtimeRef.current = runtime;
        setReady(true);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "表格编辑器加载失败。");
      }
    };

    void setup();
    return () => {
      cancelled = true;
      runtimeRef.current?.univer.dispose();
      runtimeRef.current = null;
    };
  }, []);

  const resetWorkbook = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    const current = runtime.univerAPI.getActiveWorkbook();
    if (current) runtime.univerAPI.disposeUnit(current.getId());
    runtime.univerAPI.createWorkbook(createInitialSnapshot());
    setError("");
  };

  const exportWorkbook = () => {
    const snapshot = runtimeRef.current?.univerAPI.getActiveWorkbook()?.save();
    if (!snapshot) return;
    downloadText(
      JSON.stringify(snapshot, null, 2),
      "工作簿.univer.json",
      "application/json;charset=utf-8",
    );
  };

  const importWorkbook = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !runtimeRef.current) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("文件过大，请选择 20 MB 以内的 Univer 快照。");
      return;
    }

    try {
      const snapshot: unknown = JSON.parse(await file.text());
      if (!isWorkbookSnapshot(snapshot)) throw new Error("文件不是有效的 Univer 工作簿快照。");
      const runtime = runtimeRef.current;
      const current = runtime.univerAPI.getActiveWorkbook();
      if (current) runtime.univerAPI.disposeUnit(current.getId());
      runtime.univerAPI.createWorkbook(snapshot);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取工作簿快照。");
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
            accept=".json,application/json"
            onChange={importWorkbook}
            className="sr-only"
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={!ready}>
            <FileUp className="h-3.5 w-3.5" />
            导入快照
          </Button>
          <Button variant="outline" size="sm" onClick={exportWorkbook} disabled={!ready}>
            <FileDown className="h-3.5 w-3.5" />
            导出 JSON
          </Button>
          <Button variant="outline" size="sm" onClick={resetWorkbook} disabled={!ready}>
            <RotateCcw className="h-3.5 w-3.5" />
            新建工作簿
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {ready ? "本地处理 · 不自动保存" : "正在加载表格编辑器…"}
          </span>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <div ref={containerRef} className="h-[min(72vh,48rem)] min-h-[32rem] overflow-hidden rounded-2xl border border-border bg-background" />
        <p className="text-xs leading-5 text-muted-foreground">
          表格编辑器由 Univer 提供；当前使用开源核心能力，JSON 快照可保留工作簿与单元格格式，不提供未集成的 XLSX 云端转换服务。
        </p>
      </div>
    </ToolShell>
  );
}
