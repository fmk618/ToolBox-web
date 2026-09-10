"use client";

import { Download, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import { renderMarkdown } from "./lib";
import { meta } from "./meta";

const SAMPLE = `# Markdown 预览\n\n支持 **粗体**、*斜体*、列表和代码：\n\n- 完全在浏览器中渲染\n- HTML 会经过安全清理\n\n\`\`\`ts\nconst answer = 42;\n\`\`\``;

export default function MarkdownPreviewUi() {
  const [input, setInput] = useState(SAMPLE);
  const result = useMemo(() => {
    try { return { html: renderMarkdown(input), error: "" }; }
    catch (error) { return { html: "", error: error instanceof Error ? error.message : "渲染失败" }; }
  }, [input]);
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-6 xl:grid-cols-2">
          <ToolField label="Markdown 输入" hint="最大 1 MB，支持 GFM 语法">
            <TextArea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[28rem] resize-y leading-6" spellCheck={false} />
          </ToolField>
          <section className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2"><h2 className="text-sm font-medium text-foreground">预览</h2><CopyButton value={input} /></div>
            {result.error ? <ErrorBox>{result.error}</ErrorBox> : <article className="min-h-[28rem] overflow-auto rounded-xl border border-border bg-background p-5 text-sm leading-7 text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:list-decimal [&_p]:my-3 [&_pre]:my-4 [&_pre]:overflow-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_table]:my-4 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2" dangerouslySetInnerHTML={{ __html: result.html }} />}
          </section>
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setInput(SAMPLE)}><Sparkles className="h-4 w-4" /> 填入示例</Button><Button variant="outline" onClick={() => downloadText(input, "note.md", "text/markdown;charset=utf-8")} disabled={!input}><Download className="h-4 w-4" /> 下载 Markdown</Button><Button variant="ghost" onClick={() => setInput("")}><RotateCcw className="h-3.5 w-3.5" /> 清空</Button></div>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">预览中的 HTML、脚本、事件属性和危险链接会被过滤，不会执行输入内容。</p>
      </div>
    </ToolShell>
  );
}
