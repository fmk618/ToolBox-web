"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { Segmented } from "../../components/tools/segmented";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { CopyButton } from "../../components/tools/copy-button";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import { meta } from "./meta";
import { convert, type ConvertMode } from "./lib";

const SAMPLES: Record<ConvertMode, string> = {
  "json-csv": '[\n  {"name": "Ada", "age": 37},\n  {"name": "Linus", "age": 55}\n]',
  "csv-json": "name,age\nAda,37\nLinus,55",
  "json-xml": '{\n  "name": "Ada",\n  "skills": ["TypeScript", "Python"]\n}',
  "xml-json": "<person><name>Ada</name><age>37</age></person>",
};
const LABELS: Record<ConvertMode, [string, string]> = {
  "json-csv": ["JSON", "CSV"], "csv-json": ["CSV", "JSON"], "json-xml": ["JSON", "XML"], "xml-json": ["XML", "JSON"],
};

export default function DataConvertUi() {
  const [mode, setMode] = useState<ConvertMode>("json-csv");
  const [input, setInput] = useState(SAMPLES["json-csv"]);
  const [root, setRoot] = useState("root");
  const deferred = useDebouncedValue(input, 150);
  const [inputLabel, outputLabel] = LABELS[mode];
  const result = useMemo(() => {
    try { return { value: convert(deferred, mode, root), error: "" }; }
    catch (e) { return { value: "", error: e instanceof Error ? e.message : "转换失败" }; }
  }, [deferred, mode, root]);

  function changeMode(next: ConvertMode) { setMode(next); setInput(SAMPLES[next]); }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<ConvertMode> value={mode} onChange={changeMode} options={[
            { value: "json-csv", label: "JSON → CSV" }, { value: "csv-json", label: "CSV → JSON" },
            { value: "json-xml", label: "JSON → XML" }, { value: "xml-json", label: "XML → JSON" },
          ]} />
          {mode === "json-xml" && <div className="ml-auto w-36"><TextField value={root} onChange={(e) => setRoot(e.target.value)} placeholder="XML 根节点" /></div>}
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div><ToolField label={`${inputLabel} 输入`}><TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={19} /></ToolField></div>
          <ArrowRight className="mx-auto h-5 w-5 text-muted-foreground" />
          <div className="space-y-1.5"><div className="flex items-baseline justify-between"><span className="text-xs font-medium text-muted-foreground">{outputLabel} 输出</span><CopyButton value={result.value} /></div>{result.error ? <ErrorBox>{result.error}</ErrorBox> : <TextArea value={result.value} readOnly rows={19} className="bg-muted" />}</div>
        </div>
        <div className="flex justify-end"><Button variant="outline" size="sm" onClick={() => setInput(SAMPLES[mode])}><Sparkles className="h-4 w-4" />填入示例</Button></div>
      </div>
    </ToolShell>
  );
}
