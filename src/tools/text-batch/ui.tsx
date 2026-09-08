"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import { meta } from "./meta";
import { processLines, type BatchOperation } from "./lib";

const OPS: { value: BatchOperation; label: string }[] = [
  { value: "trim", label: "去除行首尾空格" },
  { value: "remove-empty", label: "删除空白行" },
  { value: "dedupe", label: "按原顺序去重" },
  { value: "sort", label: "自然排序" },
  { value: "reverse", label: "反转顺序" },
  { value: "number", label: "添加行号" },
  { value: "prefix", label: "添加前缀" },
  { value: "suffix", label: "添加后缀" },
  { value: "replace", label: "查找并替换" },
];

export default function TextBatchUi() {
  const [input, setInput] = useState("苹果\n香蕉\n 苹果 \n\n橙子\n香蕉");
  const [operations, setOperations] = useState<BatchOperation[]>(["trim", "remove-empty", "dedupe"]);
  const [prefix, setPrefix] = useState("");
  const [suffix, setSuffix] = useState("");
  const [find, setFind] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const values = useMemo(
    () => ({ input, operations, prefix, suffix, find, replaceWith, caseSensitive }),
    [input, operations, prefix, suffix, find, replaceWith, caseSensitive],
  );
  const deferred = useDebouncedValue(values, 150);

  const output = useMemo(
    () => processLines(deferred.input, deferred),
    [deferred],
  );
  const inputLines = input ? input.replace(/\r\n?/g, "\n").split("\n").length : 0;
  const outputLines = output ? output.split("\n").length : 0;

  function toggle(op: BatchOperation) {
    setOperations((current) => current.includes(op)
      ? current.filter((v) => v !== op)
      : [...current, op]);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[15rem_1fr_1fr]">
          <aside className="rounded-xl border border-border bg-background p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">处理顺序（从上到下）</div>
            <div className="space-y-1">
              {OPS.map((op) => (
                <label key={op.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={operations.includes(op.value)}
                    onChange={() => toggle(op.value)}
                    className="h-4 w-4 accent-foreground"
                  />
                  {op.label}
                </label>
              ))}
            </div>
            {operations.includes("prefix") && <InlineInput label="前缀" value={prefix} onChange={setPrefix} />}
            {operations.includes("suffix") && <InlineInput label="后缀" value={suffix} onChange={setSuffix} />}
            {operations.includes("replace") && (
              <div className="mt-3 space-y-2">
                <InlineInput label="查找" value={find} onChange={setFind} />
                <InlineInput label="替换为" value={replaceWith} onChange={setReplaceWith} />
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} className="accent-foreground" />
                  区分大小写
                </label>
              </div>
            )}
          </aside>

          <div className="space-y-1.5">
            <ToolField label="原文本" hint={`${inputLines} 行`}>
              <TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={19} />
            </ToolField>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted-foreground">处理结果 · {outputLines} 行</span>
              <CopyButton value={output} />
            </div>
            <TextArea value={output} readOnly rows={19} className="bg-muted" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => { setInput(""); setOperations([]); }}>
            <RotateCcw className="h-4 w-4" />
            清空
          </Button>
        </div>
      </div>
    </ToolShell>
  );
}

function InlineInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="mt-3">
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <TextField value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
