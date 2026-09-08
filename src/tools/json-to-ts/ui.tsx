"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { jsonToTypeScript } from "./lib";

const SAMPLE = `[
  {
    "id": 1,
    "name": "Ada",
    "active": true,
    "tags": ["admin", "writer"]
  },
  {
    "id": 2,
    "name": "Linus",
    "active": false,
    "email": "linus@example.com"
  }
]`;

export default function JsonToTsUi() {
  const [input, setInput] = useState(SAMPLE);
  const [name, setName] = useState("User");
  const [optional, setOptional] = useState(true);
  const [readonly, setReadonly] = useState(false);

  const result = useMemo(() => {
    try {
      return { output: jsonToTypeScript(input, { rootName: name, optionalFields: optional, readonly }), error: "" };
    } catch (e) {
      return { output: "", error: e instanceof Error ? e.message : "JSON 格式无效" };
    }
  }, [input, name, optional, readonly]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <ToolField label="JSON 数据" hint="支持对象或数组">
              <TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={17}
                placeholder='{"name": "Ada"}'
              />
            </ToolField>
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <ToolField label="根类型名称">
                  <TextField value={name} onChange={(e) => setName(e.target.value)} placeholder="Root" />
                </ToolField>
              </div>
              <Toggle label="缺失字段标记为可选" checked={optional} onChange={setOptional} />
              <Toggle label="生成 readonly 属性" checked={readonly} onChange={setReadonly} />
            </div>
            <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
              <Sparkles className="h-4 w-4" />
              填入示例
            </Button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium text-muted-foreground">TypeScript</span>
              <CopyButton value={result.output} />
            </div>
            {result.error ? (
              <ErrorBox>{result.error}</ErrorBox>
            ) : (
              <pre className="min-h-[23rem] overflow-auto rounded-lg border border-border bg-muted p-3 font-mono text-sm leading-6 text-foreground">
                {result.output}
              </pre>
            )}
          </div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">实时在浏览器中推断，不上传 JSON 数据</p>
      </div>
    </ToolShell>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-foreground" />
      {label}
    </label>
  );
}
