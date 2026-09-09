"use client";

import { CheckCircle2, Loader2, Play, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import {
  validateJsonSchema,
  type SchemaDraft,
  type SchemaValidationResult,
} from "./lib";
import { meta } from "./meta";

const EXAMPLE_DATA = `{
  "name": "",
  "age": -1,
  "email": "not-an-email"
}`;

const EXAMPLE_SCHEMA = `{
  "type": "object",
  "required": ["name", "age", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 1 },
    "age": { "type": "integer", "minimum": 0 },
    "email": { "type": "string", "format": "email" }
  },
  "additionalProperties": false
}`;

export default function JsonSchemaUi() {
  const [data, setData] = useState("");
  const [schema, setSchema] = useState("");
  const [draft, setDraft] = useState<SchemaDraft>("draft-07");
  const [result, setResult] = useState<SchemaValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function validate() {
    setBusy(true);
    setError(null);
    try {
      setResult(await validateJsonSchema(data, schema, draft));
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  function loadExample() {
    setData(EXAMPLE_DATA);
    setSchema(EXAMPLE_SCHEMA);
    setDraft("draft-07");
    setResult(null);
    setError(null);
  }

  function clear() {
    setData("");
    setSchema("");
    setResult(null);
    setError(null);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          校验完全在浏览器中进行。只允许 <code className="font-mono text-foreground">#</code> 开头的本地引用；不会下载远程 Schema，也不会向任何服务发送 JSON。
        </div>

        <ToolField label="Schema 草案">
          <Segmented
            value={draft}
            onChange={(value) => {
              setDraft(value);
              setResult(null);
            }}
            options={[
              { value: "draft-07", label: "Draft 7" },
              { value: "2020-12", label: "Draft 2020-12" },
            ]}
          />
        </ToolField>

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolField label="待校验 JSON" hint="最大 1 MB">
            <TextArea
              value={data}
              onChange={(event) => setData(event.target.value)}
              placeholder={'{\n  "name": "Ada"\n}'}
              className="min-h-80 resize-y"
              spellCheck={false}
            />
          </ToolField>
          <ToolField label="JSON Schema" hint="最大 1 MB">
            <TextArea
              value={schema}
              onChange={(event) => setSchema(event.target.value)}
              placeholder={'{\n  "type": "object",\n  "properties": {}\n}'}
              className="min-h-80 resize-y"
              spellCheck={false}
            />
          </ToolField>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void validate()} disabled={busy || !data.trim() || !schema.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            开始校验
          </Button>
          <Button variant="outline" disabled={busy} onClick={loadExample}>使用示例</Button>
          <Button variant="ghost" disabled={busy} onClick={clear}>
            <RotateCcw className="h-3.5 w-3.5" />
            清空
          </Button>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        {result && (
          <section className="space-y-3">
            {result.valid ? (
              <div className="flex items-center gap-2 rounded-lg border border-green-600/30 bg-green-500/10 px-3 py-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                JSON 符合当前 Schema。
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive">
                  <XCircle className="h-5 w-5 shrink-0" />
                  发现 {result.issues.length}{result.truncated ? "+" : ""} 个不符合项。
                </div>
                <ol className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                  {result.issues.map((issue, index) => (
                    <li key={`${issue.instancePath}-${issue.schemaPath}-${index}`} className="space-y-1 p-3 text-sm">
                      <div className="font-medium text-foreground">{issue.message}</div>
                      <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                        <span className="break-all">数据路径：<code className="font-mono text-foreground">{issue.instancePath}</code></span>
                        <span className="break-all">Schema 路径：<code className="font-mono text-foreground">{issue.schemaPath}</code></span>
                      </div>
                      <div className="text-xs text-muted-foreground">规则：<code className="font-mono text-foreground">{issue.keyword}</code></div>
                    </li>
                  ))}
                </ol>
                {result.truncated && (
                  <div className="text-xs text-muted-foreground">为保持页面响应，最多显示前 100 个错误。请缩小数据或 Schema 范围。</div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </ToolShell>
  );
}
