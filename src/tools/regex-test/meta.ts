import { Regex } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "regex-test",
  name: "正则表达式",
  category: "text",
  icon: Regex,
  description: "实时匹配高亮 · 捕获组 · 结构可视化图（可导出 PNG/SVG）",
  keywords: ["regex", "regexp", "test", "match", "正则", "可视化", "铁路图"],
};
