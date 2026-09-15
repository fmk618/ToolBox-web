import { GitBranch } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "mindmap",
  name: "思维导图",
  category: "visualization",
  icon: GitBranch,
  description: "自由摆放和编辑思维导图，支持主题、节点样式、层级与关系线、AI 助手及 JSON、Markdown、SVG、PNG 导出",
  keywords: ["mindmap", "mind-elixir", "react-flow", "思维导图", "脑图", "自由画布", "节点编辑", "关系线", "自动布局", "AI"],
};
