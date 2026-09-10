import { KeyRound } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "env-editor",
  name: ".env 编辑器",
  category: "developer",
  icon: KeyRound,
  description: "在浏览器本地整理环境变量，明文只留在当前页面",
  keywords: ["env", ".env", "环境变量", "配置", "secret", "密钥"],
};
