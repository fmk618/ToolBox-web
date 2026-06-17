import { ShieldCheck } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "password",
  name: "密码生成器",
  category: "crypto",
  icon: ShieldCheck,
  description: "强随机密码，可选字符集与强度评估",
  keywords: ["password", "passwd", "generate", "密码"],
};
