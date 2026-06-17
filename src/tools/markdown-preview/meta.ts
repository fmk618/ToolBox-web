import { FileCode } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "markdown-preview",
  name: "Markdown 预览",
  category: "text",
  icon: FileCode,
  description: "实时双栏渲染（GFM 兼容）",
  keywords: ["markdown", "md", "preview", "gfm"],
};
