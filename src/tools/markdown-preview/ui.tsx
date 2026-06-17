"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import { ToolShell } from "../../components/tools/tool-shell";
import { meta } from "./meta";

const DEFAULT = `# Toolbox Markdown 预览

实时双栏渲染，支持 **GFM**。

## 任务清单

- [x] 基础工具
- [ ] 更多工具

## 表格

| 工具 | 类别 |
| ---- | ---- |
| Base64 | 编解码 |
| JWT | 加密 |

## 代码

\`\`\`ts
function hello(name: string) {
  return \`Hello, \${name}\`;
}
\`\`\`

> 引用块同样能渲染。

---

链接：[GitHub](https://github.com/fmk618/ToolBox)
`;

marked.setOptions({ gfm: true, breaks: true });

export default function MarkdownPreviewUi() {
  const [text, setText] = useState(DEFAULT);

  const html = useMemo(() => {
    try {
      return marked.parse(text) as string;
    } catch {
      return "";
    }
  }, [text]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex flex-col">
          <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            Markdown
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="h-[60vh] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-6 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <div className="flex flex-col">
          <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            预览
          </div>
          <div
            className="prose-toolbox h-[60vh] w-full overflow-auto rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </ToolShell>
  );
}
