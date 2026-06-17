import { Regex } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "regex-test",
  name: "正则测试",
  category: "text",
  icon: Regex,
  description: "实时匹配、高亮、捕获组（regex101 启发）",
  keywords: ["regex", "regexp", "test", "match", "正则"],
};
