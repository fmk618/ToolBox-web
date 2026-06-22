import { Ruler } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "unit-convert",
  name: "单位换算",
  category: "dev",
  icon: Ruler,
  description: "长度 / 重量 / 温度 / 面积 / 体积 / 数据量",
  keywords: ["unit", "convert", "换算", "单位"],
};
