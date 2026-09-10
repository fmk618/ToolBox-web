"use client";

import { Download, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import { detectDelimiter, parseDelimited, toDelimited } from "./lib";
import { meta } from "./meta";

const SAMPLE = `name,department,score\nAda,Engineering,98\nGrace,Research,95`;
type Delimiter = "comma" | "tab";

export default function CsvTableUi() {
  const [input, setInput] = useState(SAMPLE);
  const [delimiter, setDelimiter] = useState<Delimiter>("comma");
  const [filter, setFilter] = useState("");
  const result = useMemo(() => {
    try { return { rows: parseDelimited(input, delimiter), error: "" }; }
    catch (error) { return { rows: [], error: error instanceof Error ? error.message : "表格解析失败" }; }
  }, [input, delimiter]);
  const shown = useMemo(() => {
    if (!filter.trim()) return result.rows;
    const query = filter.toLocaleLowerCase();
    return result.rows.filter((row) => row.some((cell) => cell.toLocaleLowerCase().includes(query)));
  }, [filter, result.rows]);
  function download() { if (result.rows.length) downloadText(toDelimited(result.rows, delimiter), delimiter === "tab" ? "table.tsv" : "table.csv", "text/csv;charset=utf-8"); }
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <ToolField label="CSV / TSV 输入" hint="支持引号、换行和转义，最大 5 MB">
            <TextArea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[25rem] resize-y" spellCheck={false} />
            <div className="mt-3"><Segmented<Delimiter> value={delimiter} onChange={setDelimiter} options={[{ value: "comma", label: "CSV 逗号" }, { value: "tab", label: "TSV 制表符" }]} /></div>
          </ToolField>
          <section className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-medium text-foreground">表格预览</h2><span className="text-xs text-muted-foreground">{shown.length}/{result.rows.length} 行 · {result.rows[0]?.length ?? 0} 列</span></div><div className="flex gap-2"><TextField aria-label="筛选行" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="筛选行" className="h-8 w-32 px-2 py-1.5 text-xs" /><Button variant="outline" size="sm" onClick={download} disabled={!result.rows.length}><Download className="h-3.5 w-3.5" />下载</Button></div></div>
            {result.error ? <ErrorBox>{result.error}</ErrorBox> : <div className="max-h-[25rem] overflow-auto rounded-xl border border-border"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 bg-muted text-muted-foreground"><tr>{(result.rows[0] ?? []).map((_, index) => <th key={index} className="whitespace-nowrap px-3 py-2 font-medium">{result.rows[0]?.[index] || `列 ${index + 1}`}</th>)}</tr></thead><tbody className="divide-y divide-border">{shown.slice(1).map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-muted/40">{row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-64 whitespace-pre-wrap break-words px-3 py-2 text-foreground">{cell}</td>)}</tr>)}</tbody></table>{result.rows.length <= 1 && <div className="p-4 text-xs text-muted-foreground">至少输入表头和一行数据</div>}</div>}
          </section>
        </div>
        <Button variant="outline" onClick={() => setInput(SAMPLE)}><Sparkles className="h-4 w-4" /> 填入示例（当前识别：{detectDelimiter(input) === "tab" ? "TSV" : "CSV"}）</Button>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">导出前请确认单元格内容可信；将 CSV 导入电子表格时，谨慎处理以 =、+、-、@ 开头的公式文本。</p>
      </div>
    </ToolShell>
  );
}
