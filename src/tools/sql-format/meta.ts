import { AlignJustify } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "sql-format",
  name: "SQL 格式化",
  category: "developer",
  icon: AlignJustify,
  description: "本地格式化常见 SQL 查询，保留字符串和注释内容",
  keywords: ["sql", "format", "格式化", "mysql", "postgresql", "查询"],
};
