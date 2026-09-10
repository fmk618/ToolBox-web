"use client";

import { Database, Download, Loader2, Play, RotateCcw, Table2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { TextArea } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import {
  MAX_DATABASE_BYTES,
  MAX_RESULT_BYTES,
  MAX_RESULT_ROWS,
  createCsv,
  quoteIdentifier,
  validateDatabaseFile,
  type DatabaseTable,
  type SqlQueryResult,
  type SqliteWorkerResponse,
} from "./lib";
import { meta } from "./meta";

type WorkerCommand =
  | { type: "open"; bytes: ArrayBuffer }
  | { type: "query"; sql: string }
  | { type: "table"; table: string }
  | { type: "close" };

type PendingRequest = {
  resolve: (response: SqliteWorkerResponse) => void;
  reject: (reason: Error) => void;
};

type WorkerClient = {
  worker: Worker;
  nextId: number;
  pending: Map<number, PendingRequest>;
};

export default function SqliteViewerUi() {
  const clientRef = useRef<WorkerClient | null>(null);
  const operationRef = useRef(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [query, setQuery] = useState("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name;");
  const [result, setResult] = useState<SqlQueryResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => destroyWorker(clientRef.current), []);

  async function openDatabase(files: File[]) {
    const file = files[0];
    if (!file) return;
    const validationError = validateDatabaseFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const operation = ++operationRef.current;
    resetDatabase();
    setBusy("正在在独立 Worker 中打开数据库…");
    setError(null);
    let client: WorkerClient | null = null;
    try {
      const bytes = await file.arrayBuffer();
      client = createWorkerClient();
      clientRef.current = client;
      const response = await send(client, { type: "open", bytes }, [bytes]);
      if (response.type !== "opened") throw new Error("工作进程返回了意外的响应。");
      if (operation !== operationRef.current) return;
      setFileName(file.name);
      setFileSize(file.size);
      setTables(response.tables);
      setSelectedTable(null);
      setResult(null);
    } catch (caught) {
      if (operation !== operationRef.current) return;
      destroyWorker(client);
      if (clientRef.current === client) clientRef.current = null;
      setError(errorMessage(caught));
    } finally {
      if (operation === operationRef.current) setBusy(null);
    }
  }

  async function previewTable(table: DatabaseTable) {
    const client = clientRef.current;
    if (!client) return;
    const operation = ++operationRef.current;
    setBusy(`正在读取 ${table.name}…`);
    setError(null);
    try {
      const response = await send(client, { type: "table", table: table.name });
      if (response.type !== "result") throw new Error("工作进程返回了意外的响应。");
      if (operation !== operationRef.current) return;
      setSelectedTable(table.name);
      setQuery(`SELECT * FROM ${quoteIdentifier(table.name)} LIMIT ${MAX_RESULT_ROWS};`);
      setResult(response.result);
    } catch (caught) {
      if (operation === operationRef.current) setError(errorMessage(caught));
    } finally {
      if (operation === operationRef.current) setBusy(null);
    }
  }

  async function runQuery() {
    const client = clientRef.current;
    if (!client) return;
    const operation = ++operationRef.current;
    setBusy("正在执行只读查询…");
    setError(null);
    try {
      const response = await send(client, { type: "query", sql: query });
      if (response.type !== "result") throw new Error("工作进程返回了意外的响应。");
      if (operation !== operationRef.current) return;
      setSelectedTable(null);
      setResult(response.result);
    } catch (caught) {
      if (operation === operationRef.current) setError(errorMessage(caught));
    } finally {
      if (operation === operationRef.current) setBusy(null);
    }
  }

  function downloadCsv() {
    if (!result) return;
    const blob = new Blob([createCsv(result)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fileBaseName(fileName ?? "sqlite-result")}.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  function resetDatabase() {
    destroyWorker(clientRef.current);
    clientRef.current = null;
    setFileName(null);
    setFileSize(0);
    setTables([]);
    setSelectedTable(null);
    setResult(null);
  }

  function cancelAndClose() {
    resetDatabase();
    setBusy(null);
    setError("已终止工作进程并关闭数据库。请重新打开文件后继续操作。");
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          数据库只会传入独立 Worker 的内存，不会上传、保存或修改原文件。最大 {formatBytes(MAX_DATABASE_BYTES)}；查询仅允许单条 SELECT，结果最多 {MAX_RESULT_ROWS.toLocaleString("zh-CN")} 行、{formatBytes(MAX_RESULT_BYTES)}。终止任务会关闭当前数据库。
        </div>

        {!fileName && (
          <FileDropZone
            accept=".db,.db3,.sqlite,.sqlite3,application/vnd.sqlite3,application/x-sqlite3"
            validate={(file) => /\.(?:db|db3|sqlite|sqlite3)$/iu.test(file.name) || /sqlite/iu.test(file.type)}
            onFiles={(files) => void openDatabase(files)}
            title="拖入 SQLite 数据库，或"
            hint="支持 .db、.db3、.sqlite、.sqlite3 · 只读打开 · 最大 50 MB"
          />
        )}

        {busy && !fileName && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />{busy}
            <Button size="sm" variant="ghost" className="ml-auto" onClick={cancelAndClose}><X className="h-3.5 w-3.5" />取消</Button>
          </div>
        )}

        {fileName && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card p-3 text-sm">
              <span className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground"><Database className="h-4 w-4 shrink-0" /><span className="truncate">{fileName}</span></span>
              <span className="text-muted-foreground">{formatBytes(fileSize)}</span>
              <span className="text-muted-foreground">{tables.length} 个表或视图</span>
              {busy && <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />{busy}</span>}
              <Button size="sm" variant="ghost" className="ml-auto" onClick={cancelAndClose} disabled={!busy}><X className="h-3.5 w-3.5" />终止任务</Button>
              <Button size="sm" variant="outline" onClick={resetDatabase} disabled={Boolean(busy)}><RotateCcw className="h-3.5 w-3.5" />关闭数据库</Button>
            </div>

            <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)]">
              <aside className="rounded-xl border border-border bg-card p-3">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground"><Table2 className="h-4 w-4" />表与视图</h2>
                {tables.length ? (
                  <div className="max-h-[42rem] space-y-1 overflow-y-auto">
                    {tables.map((table) => (
                      <div key={`${table.type}-${table.name}`}>
                        <button
                          type="button"
                          disabled={Boolean(busy)}
                          onClick={() => void previewTable(table)}
                          className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${selectedTable === table.name ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                        >
                          <span className="truncate">{table.name}</span><span className="shrink-0 text-[10px] text-muted-foreground">{table.type === "view" ? "视图" : "表"}</span>
                        </button>
                        {table.schema && (
                          <details className="px-2.5 pb-1 text-xs text-muted-foreground">
                            <summary className="cursor-pointer py-1 hover:text-foreground">查看 Schema</summary>
                            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/50 p-2 font-mono text-[11px] leading-5 text-foreground">{table.schema}</pre>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <Empty>数据库中没有可浏览的表或视图</Empty>}
              </aside>

              <div className="space-y-4">
                <section className="rounded-xl border border-border bg-card p-3">
                  <ToolField label="只读 SQL 查询" hint="仅支持一条 SELECT；不支持 INSERT、UPDATE、DELETE、PRAGMA 或多语句。">
                    <TextArea value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-36 resize-y font-mono text-xs" spellCheck={false} />
                  </ToolField>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => void runQuery()} disabled={Boolean(busy) || !query.trim()}>
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}运行 SELECT
                    </Button>
                    <Button variant="outline" onClick={downloadCsv} disabled={Boolean(busy) || !result?.rows.length}>
                      <Download className="h-4 w-4" />导出 CSV
                    </Button>
                  </div>
                </section>

                <ResultPanel result={result} />
              </div>
            </div>
          </>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}
      </div>
    </ToolShell>
  );
}

function ResultPanel({ result }: { result: SqlQueryResult | null }) {
  if (!result) return <section className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">选择左侧数据表，或运行 SELECT 查询查看结果。</section>;
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5 text-xs text-muted-foreground">
        <span>显示 {result.rows.length.toLocaleString("zh-CN")} 行</span>
        {result.truncated && <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-700 dark:text-amber-300">结果已按上限截断</span>}
      </div>
      <div className="max-h-[36rem] overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-muted/95 backdrop-blur"><tr>{result.columns.map((column, index) => <th key={`${column}-${index}`} className="whitespace-nowrap border-b border-border px-3 py-2 font-medium text-foreground">{column}</th>)}</tr></thead>
          <tbody>{result.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-b border-border/70 last:border-0 hover:bg-muted/30">{row.map((value, columnIndex) => <td key={columnIndex} className={`max-w-80 break-words px-3 py-2 align-top leading-5 ${value === null ? "italic text-muted-foreground" : "text-foreground"}`}>{value === null ? "NULL" : String(value)}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {!result.rows.length && <div className="px-4 py-10 text-center text-sm text-muted-foreground">查询未返回数据行。</div>}
    </section>
  );
}

function createWorkerClient(): WorkerClient {
  const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  const client: WorkerClient = { worker, nextId: 1, pending: new Map() };
  worker.onmessage = (event: MessageEvent<SqliteWorkerResponse>) => {
    const response = event.data;
    const pending = client.pending.get(response.id);
    if (!pending) return;
    client.pending.delete(response.id);
    if (response.type === "error") pending.reject(new Error(response.message));
    else pending.resolve(response);
  };
  worker.onerror = () => {
    rejectPending(client, new Error("SQLite 工作进程意外停止。请重新打开数据库。"));
  };
  return client;
}

function send(client: WorkerClient, command: WorkerCommand, transfer: Transferable[] = []): Promise<SqliteWorkerResponse> {
  const id = client.nextId;
  client.nextId += 1;
  return new Promise((resolve, reject) => {
    client.pending.set(id, { resolve, reject });
    try {
      client.worker.postMessage({ id, ...command }, transfer);
    } catch (caught) {
      client.pending.delete(id);
      reject(new Error(errorMessage(caught)));
    }
  });
}

function destroyWorker(client: WorkerClient | null): void {
  if (!client) return;
  rejectPending(client, new Error("SQLite 工作进程已关闭。"));
  client.worker.terminate();
}

function rejectPending(client: WorkerClient, error: Error): void {
  for (const pending of client.pending.values()) pending.reject(error);
  client.pending.clear();
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function fileBaseName(name: string): string {
  const base = name.replace(/\.(?:db|db3|sqlite|sqlite3)$/iu, "").trim() || "sqlite-result";
  return base.replace(/[\\/:*?"<>|\\u0000-\\u001f]/gu, "-").slice(0, 80) || "sqlite-result";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">{children}</div>;
}
