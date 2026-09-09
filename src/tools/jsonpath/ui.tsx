"use client";

import { Loader2, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea, TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import {
  queryJsonPath,
  stringifyMatchedValues,
  type JsonPathMatch,
} from "./lib";
import { meta } from "./meta";

const EXAMPLE_JSON = `{
  "store": {
    "book": [
      { "title": "清晨", "price": 28, "tags": ["novel"] },
      { "title": "星图", "price": 42, "tags": ["science", "featured"] }
    ]
  }
}`;

export default function JsonPathUi() {
  const [source, setSource] = useState("");
  const [expression, setExpression] = useState("$.store.book[*].title");
  const [matches, setMatches] = useState<JsonPathMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runQuery() {
    setBusy(true);
    setError(null);
    try {
      setMatches(await queryJsonPath(source, expression));
    } catch (caught) {
      setMatches(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  function loadExample() {
    setSource(EXAMPLE_JSON);
    setExpression("$.store.book[*].title");
    setMatches(null);
    setError(null);
  }

  function reset() {
    setSource("");
    setExpression("$.store.book[*].title");
    setMatches(null);
    setError(null);
  }

  const output = matches ? stringifyMatchedValues(matches) : "";

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          支持根节点、字段、下标、通配符、切片与递归查询，例如 <code className="font-mono text-foreground">$.items[*].name</code> 和 <code className="font-mono text-foreground">$..price</code>。
          为保护本地数据，筛选脚本、函数和 JavaScript 求值始终禁用。
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolField label="JSON 数据" hint={`${new TextEncoder().encode(source).byteLength.toLocaleString()} / 1 MB`}>
            <TextArea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={'{\n  "items": [{ "name": "示例" }]\n}'}
              className="min-h-72 resize-y"
              spellCheck={false}
            />
          </ToolField>
          <div className="space-y-4">
            <ToolField label="JSONPath 表达式" hint="最长 2,000 字符">
              <TextField
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                placeholder="$.items[*].name"
                spellCheck={false}
              />
            </ToolField>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void runQuery()} disabled={busy || !source.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                查询
              </Button>
              <Button variant="outline" onClick={loadExample} disabled={busy}>
                使用示例
              </Button>
              <Button variant="ghost" onClick={reset} disabled={busy}>
                <RotateCcw className="h-3.5 w-3.5" />
                清空
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs leading-5 text-muted-foreground">
              <div className="font-medium text-foreground">常用示例</div>
              <ul className="mt-1.5 space-y-1 font-mono">
                <li>$.store.book[*].title</li>
                <li>$..price</li>
                <li>$.items[0:10:2]</li>
                <li>{'$["含空格的字段"]'}</li>
              </ul>
            </div>
          </div>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        {matches && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">匹配到 {matches.length} 项</div>
              <CopyButton value={output} />
            </div>

            {matches.length === 0 ? (
              <div className="rounded-lg border border-border bg-card px-3 py-8 text-center text-sm text-muted-foreground">
                没有匹配项。请检查路径和字段名称。
              </div>
            ) : (
              <ol className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {matches.map((match, index) => (
                  <li key={`${match.pointer}-${index}`} className="p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <code className="min-w-0 break-all text-xs text-muted-foreground">{match.path}</code>
                      <CopyButton value={JSON.stringify(match.value, null, 2)} />
                    </div>
                    <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted/50 p-2.5 text-xs leading-5 whitespace-pre-wrap break-words">
                      {JSON.stringify(match.value, null, 2)}
                    </pre>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </ToolShell>
  );
}
