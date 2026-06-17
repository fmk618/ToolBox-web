import { ScrollText } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "jwt-decode",
  name: "JWT 解码",
  category: "crypto",
  icon: ScrollText,
  description: "解析 JWT 头部、载荷与过期时间（jwt.io 启发，本地解析）",
  keywords: ["jwt", "token", "decode", "auth"],
};
