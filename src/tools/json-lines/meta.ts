import { Braces } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "json-lines",
  name: "JSON Lines 检查",
  category: "data",
  icon: Braces,
  description: "逐行校验 JSON Lines / NDJSON，快速定位格式错误",
  keywords: ["jsonl", "ndjson", "json", "逐行", "校验", "日志"],
};
