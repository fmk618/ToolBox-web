import { AlignLeft } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "text-stat",
  name: "文字统计",
  category: "text",
  icon: AlignLeft,
  description: "字符数 / 词数 / 行数 / 阅读时间实时统计",
  keywords: ["word count", "character", "文字", "统计", "字数", "字符", "行数", "阅读"],
};
