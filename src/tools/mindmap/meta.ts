import { GitBranch } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "mindmap",
  name: "思维导图",
  category: "visualization",
  icon: GitBranch,
  description: "本地编辑思维导图，支持主题、节点样式、布局、大纲搜索和 JSON、Markdown、SVG、PNG 导出",
  keywords: ["mindmap", "mind-elixir", "思维导图", "脑图", "知识树", "大纲", "主题", "节点样式"],
};
