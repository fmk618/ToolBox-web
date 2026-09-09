import { CodeXml } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "code-format",
  name: "代码格式化",
  category: "developer",
  icon: CodeXml,
  description: "用 Prettier 在本地格式化 JS、TS、HTML、CSS、Markdown 和 YAML",
  keywords: ["prettier", "代码", "格式化", "javascript", "typescript", "html", "css"],
};
