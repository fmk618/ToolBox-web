import { GitBranch } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "mindmap",
  name: "思维导图",
  category: "visualization",
  icon: GitBranch,
  description: "编辑可拖拽的思维导图和知识树，并导出 JSON、SVG 或 PNG",
  keywords: ["mindmap", "mind-elixir", "思维导图", "脑图", "知识树"],
};
