import { GitCompare } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "text-diff",
  name: "Diff 对比",
  category: "text",
  icon: GitCompare,
  description: "行级 / 字符级文本差异（jsdiff）",
  keywords: ["diff", "compare", "比较", "对比"],
};
