import { Code } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "html-entity",
  name: "HTML 实体编/解码",
  category: "codec",
  icon: Code,
  description: "HTML 特殊字符转义与反转义",
  keywords: ["html", "entity", "escape", "实体"],
};
