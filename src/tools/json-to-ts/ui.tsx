"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { CodeOutput, type CodeOutputBackground } from "../../components/tools/code-output";
import { TextArea, TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { jsonToTypeScript } from "./lib";
import { meta } from "./meta";

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
  const [background, setBackground] = useState<CodeOutputBackground>("light");

  const result = useMemo(() => {
    try {
      return {
        output: jsonToTypeScript(input, {
          rootName: name,
          optionalFields: optional,
          readonly,
        }),
        error: "",
      };
    } catch (error) {
      return {
        output: "",
        error: error instanceof Error ? error.message : "JSON 格式无效",
      };
    }
  }, [input, name, optional, readonly]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-4 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-[10rem_1fr] sm:items-end">
          <ToolField label="根类型名称">
            <TextField value={name} onChange={(event) => setName(event.target.value)} placeholder="Root" />
          </ToolField>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-2">
            <Toggle label="缺失字段标记为可选" checked={optional} onChange={setOptional} />
            <Toggle label="生成 readonly 属性" checked={readonly} onChange={setReadonly} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-3">
            <ToolField label="JSON 数据" hint="支持对象或数组，推断仅在浏览器内完成">
              <TextArea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="min-h-[24rem] resize-y text-sm leading-6"
                placeholder='{"name": "Ada"}'
                spellCheck={false}
              />
            </ToolField>
            <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
              <Sparkles className="h-4 w-4" />
              填入示例
            </Button>
          </div>

          <CodeOutput
            label="TypeScript 类型"
            value={result.output}
            error={result.error}
            background={background}
            onBackgroundChange={setBackground}
          />
        </div>

        <p className="text-center text-[11px] leading-5 text-muted-foreground">
          复制内容只包含 TypeScript 类型文本，不含行号、背景和界面提示；JSON 不会上传或保存。
        </p>
      </div>
    </ToolShell>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-foreground"
      />
      {label}
    </label>
  );
}
