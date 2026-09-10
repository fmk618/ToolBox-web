import { Route } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "jsonpath",
  name: "JSONPath 查询",
  category: "data",
  icon: Route,
  description: "使用受限 JSONPath 在本地 JSON 中精确查找数据",
  keywords: ["json", "jsonpath", "查询", "path", "筛选"],
};
