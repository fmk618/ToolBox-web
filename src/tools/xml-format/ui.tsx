"use client";

import { Download, RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { CodeOutput, type CodeOutputBackground } from "../../components/tools/code-output";
import { TextArea } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import { formatXml } from "./lib";
import { meta } from "./meta";

const SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>\n<catalog><book id="bk101"><title>XML Developer's Guide</title><price>44.95</price></book></catalog>`;

export default function XmlFormatUi() {
  const [input, setInput] = useState(SAMPLE);
  const [background, setBackground] = useState<CodeOutputBackground>("light");
  const result = useMemo(() => {
    try { return { value: formatXml(input), error: "" }; }
    catch (error) { return { value: "", error: error instanceof Error ? error.message : "XML 处理失败" }; }
  }, [input]);
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <ToolField label="XML 输入" hint="仅在浏览器中解析，最大 5 MB">
            <TextArea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[24rem] resize-y text-sm leading-6" placeholder="<root><item /></root>" spellCheck={false} />
          </ToolField>
          <CodeOutput label="格式化结果" value={result.value} error={result.error} background={background} onBackgroundChange={setBackground} extraAction={<Button variant="outline" size="sm" onClick={() => downloadText(result.value, "formatted.xml", "application/xml;charset=utf-8")} disabled={!result.value}><Download className="h-3.5 w-3.5" />下载 XML</Button>} />
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setInput(SAMPLE)}><Sparkles className="h-4 w-4" /> 填入示例</Button><Button variant="ghost" onClick={() => setInput("")}><RotateCcw className="h-3.5 w-3.5" /> 清空</Button></div>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">不支持 DOCTYPE 和外部实体；格式化不会加载或请求 XML 中的外部资源。</p>
      </div>
    </ToolShell>
  );
}
