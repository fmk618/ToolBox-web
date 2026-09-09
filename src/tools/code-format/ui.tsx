"use client";

import { Braces, Loader2, RotateCcw, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { formatCode, type FormatLanguage } from "./lib";
import { meta } from "./meta";

const LANGUAGE_OPTIONS: readonly { value: FormatLanguage; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "markdown", label: "Markdown" },
  { value: "yaml", label: "YAML" },
];

export default function CodeFormatUi() {
  const [source, setSource] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState<FormatLanguage>("javascript");
  const [tabWidth, setTabWidth] = useState<2 | 4>(2);
  const [semi, setSemi] = useState(true);
  const [singleQuote, setSingleQuote] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function format() {
    setBusy(true);
    setError(null);
    try {
      setOutput(await formatCode(source, { language, tabWidth, semi, singleQuote }));
    } catch (caught) {
      setOutput("");
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setSource("");
    setOutput("");
    setError(null);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          格式化在浏览器本地运行，输入不会上传或保存。JSON 和 SQL 已有专用工具；此处支持 JavaScript、TypeScript、HTML、CSS、Markdown 和 YAML，单次输入最多 500 KB。
        </div>

        <ToolField label="语言">
          <Segmented<FormatLanguage>
            value={language}
            onChange={(value) => {
              setLanguage(value);
              setOutput("");
              setError(null);
            }}
            options={LANGUAGE_OPTIONS}
            className="max-w-full overflow-x-auto"
          />
        </ToolField>

        <div className="grid gap-4 rounded-lg border border-border bg-card p-3 sm:grid-cols-3">
          <ToolField label="缩进">
            <Segmented<"2" | "4">
              value={String(tabWidth) as "2" | "4"}
              onChange={(value) => setTabWidth(Number(value) as 2 | 4)}
              options={[{ value: "2", label: "2 空格" }, { value: "4", label: "4 空格" }]}
            />
          </ToolField>
          <ToolField label="分号">
            <Segmented<"yes" | "no">
              value={semi ? "yes" : "no"}
              onChange={(value) => setSemi(value === "yes")}
              options={[{ value: "yes", label: "保留" }, { value: "no", label: "省略" }]}
            />
          </ToolField>
          <ToolField label="字符串引号">
            <Segmented<"single" | "double">
              value={singleQuote ? "single" : "double"}
              onChange={(value) => setSingleQuote(value === "single")}
              options={[{ value: "single", label: "单引号" }, { value: "double", label: "双引号" }]}
            />
          </ToolField>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolField label="输入" hint="最多 500 KB">
            <TextArea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={language === "javascript" ? "const value={name:'FMKTools',items:[1,2,3]}" : "粘贴要格式化的内容"}
              className="min-h-96 resize-y"
              spellCheck={false}
            />
          </ToolField>
          <ToolField label="格式化结果" action={<CopyButton value={output} />}>
            <TextArea value={output} readOnly placeholder="格式化结果将在此显示" className="min-h-96 resize-y" spellCheck={false} />
          </ToolField>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void format()} disabled={busy || !source.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            格式化
          </Button>
          <Button variant="ghost" onClick={reset} disabled={busy}>
            <RotateCcw className="h-3.5 w-3.5" />
            清空
          </Button>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}
        {output && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Braces className="h-3.5 w-3.5" />已使用 Prettier 本地格式化，输出统一为 LF 换行。</div>
        )}
      </div>
    </ToolShell>
  );
}
