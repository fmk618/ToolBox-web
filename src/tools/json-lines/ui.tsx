"use client";

import { AlertCircle, CheckCircle2, Download, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { TextArea } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { inspectJsonLines } from "./lib";
import { meta } from "./meta";

const SAMPLE = `{"id":1,"name":"Ada"}\n{"id":2,"name":"Grace"}\ninvalid json`;

export default function JsonLinesUi() {
  const [input, setInput] = useState(SAMPLE);
  const result = useMemo(() => {
    try { return { rows: inspectJsonLines(input), error: "" }; }
    catch (error) { return { rows: [], error: error instanceof Error ? error.message : "解析失败" }; }
  }, [input]);
  const invalid = result.rows.filter((row) => row.error).length;
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ToolField label="JSON Lines 输入" hint="每行一个 JSON 值，空行会忽略，最大 10,000 行">
            <TextArea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[26rem] resize-y" spellCheck={false} />
          </ToolField>
          <section className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2"><h2 className="text-sm font-medium text-foreground">逐行检查</h2><span className="text-xs text-muted-foreground">{result.rows.length} 行 · {invalid ? `${invalid} 个错误` : "全部有效"}</span></div>
            <div className="max-h-[26rem] overflow-auto rounded-xl border border-border"><div className="divide-y divide-border">{result.rows.map((row) => <div key={row.line} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-3 p-3 text-xs"><div className="font-mono text-muted-foreground">{row.line}</div><div className="min-w-0">{row.error ? <div className="flex gap-2 text-destructive"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><div><div className="break-all font-mono">{row.source}</div><div className="mt-1">{row.error}</div></div></div> : <div className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" /><code className="break-all text-foreground">{JSON.stringify(row.value)}</code></div>}</div></div>)}</div>{!result.rows.length && !result.error && <div className="p-4 text-xs text-muted-foreground">输入 JSON Lines 后显示结果</div>}</div>
          </section>
        </div>
        {result.error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{result.error}</div>}
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setInput(SAMPLE)}><Download className="h-4 w-4" /> 使用示例</Button><Button variant="ghost" onClick={() => setInput("")}><RotateCcw className="h-3.5 w-3.5" /> 清空</Button></div>
      </div>
    </ToolShell>
  );
}
