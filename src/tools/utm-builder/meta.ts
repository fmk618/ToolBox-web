import { Link } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "utm-builder",
  name: "UTM 链接生成",
  category: "network",
  icon: Link,
  description: "在浏览器本地生成营销追踪链接，不访问目标网址",
  keywords: ["utm", "url", "链接", "营销", "campaign", "追踪"],
};
