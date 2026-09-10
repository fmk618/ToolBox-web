import { FileText } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "markdown-preview",
  name: "Markdown 预览",
  category: "text",
  icon: FileText,
  description: "在浏览器本地渲染 Markdown，支持安全预览、复制和下载",
  keywords: ["markdown", "md", "预览", "文档", "readme"],
};
