import { BadgeCheck } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "json-schema",
  name: "JSON Schema 校验",
  category: "data",
  icon: BadgeCheck,
  description: "用本地 JSON Schema 校验数据并定位不符合的字段",
  keywords: ["json", "schema", "校验", "验证", "ajv", "draft"],
};
