"use client";

import { AlertTriangle, Eye, EyeOff, Download, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import { duplicateEnvKeys, parseEnv } from "./lib";
import { meta } from "./meta";

const SAMPLE = `# Application\nAPP_ENV=development\nPORT=3000\nDATABASE_URL="postgres://localhost/app"`;

export default function EnvEditorUi() {
  const [input, setInput] = useState(SAMPLE);
  const [reveal, setReveal] = useState(false);
  const result = useMemo(() => {
    try {
      const lines = parseEnv(input);
      return { lines, error: "" };
    } catch (error) { return { lines: [], error: error instanceof Error ? error.message : "解析失败" }; }
  }, [input]);
  const errors = result.lines.filter((line) => line.kind === "error");
  const duplicates = duplicateEnvKeys(result.lines);
  const entries = result.lines.filter((line) => line.kind === "entry");
  function download() { downloadText(input, ".env", "text/plain;charset=utf-8"); }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs leading-5 text-amber-800 dark:text-amber-300"><AlertTriangle className="mr-1 inline h-3.5 w-3.5" />环境变量可能包含密钥。内容只保留在当前页面，不会保存或发送；使用完请关闭页面。</div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <ToolField label=".env 内容" hint="支持 KEY=value、export 和 # 注释，最大 1 MB">
            <TextArea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[26rem] resize-y" spellCheck={false} />
          </ToolField>
          <section className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-medium text-foreground">变量预览（{entries.length}）</h2><Button variant="ghost" size="sm" onClick={() => setReveal((value) => !value)}>{reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{reveal ? "隐藏值" : "显示值"}</Button></div>
            <div className="max-h-[26rem] overflow-auto rounded-xl border border-border"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-muted/80 text-muted-foreground"><tr><th className="px-3 py-2 font-medium">键</th><th className="px-3 py-2 font-medium">值</th></tr></thead><tbody className="divide-y divide-border">{entries.map((line) => <tr key={line.line}><td className="px-3 py-2 font-mono text-foreground">{line.key}</td><td className="max-w-48 truncate px-3 py-2 font-mono text-muted-foreground">{reveal ? line.value : "•".repeat(Math.min(Math.max(line.value.length, 4), 12))}</td></tr>)}</tbody></table>{!entries.length && <div className="p-4 text-xs text-muted-foreground">输入变量后显示预览</div>}</div>
          </section>
        </div>
        {errors.length > 0 && <ErrorBox>{errors.map((line) => `第 ${line.line} 行：${line.error}`).join("；")}</ErrorBox>}
        {duplicates.length > 0 && <div className="text-xs text-amber-700 dark:text-amber-300">重复键：{duplicates.join("、")}（后出现的值通常会覆盖前一个）</div>}
        <div className="flex flex-wrap gap-2"><Button onClick={download} disabled={!input}><Download className="h-4 w-4" /> 下载 .env</Button><Button variant="outline" onClick={() => setInput(SAMPLE)}>填入示例</Button><Button variant="ghost" onClick={() => setInput("")}><RotateCcw className="h-3.5 w-3.5" /> 清空</Button></div>
      </div>
    </ToolShell>
  );
}
