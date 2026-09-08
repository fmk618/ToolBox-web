import { Braces } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "json-to-ts",
  name: "JSON → TS 类型",
  category: "developer",
  icon: Braces,
  description: "将 JSON 数据智能推断为 TypeScript interface / type",
  keywords: ["json", "typescript", "interface", "type", "类型", "推断"],
};
