"use client";

import { Download, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { CodeOutput, type CodeOutputBackground } from "../../components/tools/code-output";
import { TextArea } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import { formatSql } from "./lib";
import { meta } from "./meta";

const SAMPLE = "select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=true and o.created_at >= '2026-01-01' group by u.id,u.name order by orders desc limit 20;";

export default function SqlFormatUi() {
  const [input, setInput] = useState(SAMPLE);
  const [uppercase, setUppercase] = useState(true);
  const [background, setBackground] = useState<CodeOutputBackground>("light");
  const deferred = useDebouncedValue(input, 150);
  const result = useMemo(() => {
    try {
      return { value: formatSql(deferred, uppercase), error: "" };
    } catch (error) {
      return {
        value: "",
        error: error instanceof Error ? error.message : "格式化失败",
      };
    }
  }, [deferred, uppercase]);

  function download() {
    if (result.value) downloadText(result.value, "formatted-query.sql");
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 p-3">
          <div>
            <div className="text-sm font-medium text-foreground">格式化选项</div>
            <div className="mt-0.5 text-xs text-muted-foreground">只调整排版与关键字大小写，不执行 SQL</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented<"upper" | "lower">
              value={uppercase ? "upper" : "lower"}
              onChange={(value) => setUppercase(value === "upper")}
              options={[{ value: "upper", label: "关键字大写" }, { value: "lower", label: "关键字小写" }]}
            />
            <Button variant="outline" size="sm" onClick={() => setInput(SAMPLE)}>
              <Sparkles className="h-4 w-4" />
              填入示例
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <ToolField label="SQL 输入" hint="常见 DML">
            <TextArea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              className="min-h-[24rem] resize-y text-sm leading-6"
              placeholder="SELECT * FROM users"
              spellCheck={false}
            />
          </ToolField>

          <CodeOutput
            label="格式化结果"
            value={result.value}
            error={result.error}
            background={background}
            onBackgroundChange={setBackground}
            extraAction={(
              <Button variant="outline" size="sm" onClick={download} disabled={!result.value}>
                <Download className="h-3.5 w-3.5" />
                下载 .sql
              </Button>
            )}
          />
        </div>

        <p className="text-center text-[11px] leading-5 text-muted-foreground">
          格式化仅在当前浏览器页面内完成。复制或下载的内容只包含纯 SQL 文本，不含行号、背景和界面提示。
        </p>
      </div>
    </ToolShell>
  );
}
