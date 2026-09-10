import { CodeXml } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "xml-format",
  name: "XML 格式化",
  category: "data",
  icon: CodeXml,
  description: "在浏览器本地格式化并校验 XML，不加载外部资源",
  keywords: ["xml", "格式化", "pretty print", "校验", "配置"],
};
