import { ArrowLeftRight } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "yaml-json",
  name: "YAML ⇄ JSON",
  category: "text",
  icon: ArrowLeftRight,
  description: "双向无损转换与语法校验",
  keywords: ["yaml", "json", "convert"],
};
