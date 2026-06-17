import { Braces } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "json-format",
  name: "JSON 格式化",
  category: "text",
  icon: Braces,
  description: "校验、美化、压缩 JSON",
  keywords: ["json", "format", "pretty", "minify"],
};
