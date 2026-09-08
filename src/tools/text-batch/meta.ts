import { ListFilter } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "text-batch",
  name: "文本批量处理",
  category: "text",
  icon: ListFilter,
  description: "按行批量清理、去重、排序、替换、添加前后缀与编号",
  keywords: ["文本", "批量", "去重", "排序", "替换", "前缀", "后缀"],
};
