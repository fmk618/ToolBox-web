import { TableProperties } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "data-convert",
  name: "JSON ⇄ CSV / XML",
  category: "data",
  icon: TableProperties,
  description: "在浏览器本地互转 JSON、CSV 和 XML 数据",
  keywords: ["json", "csv", "xml", "转换", "excel", "数据"],
};
