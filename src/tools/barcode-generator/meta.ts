import { Barcode } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "barcode-generator",
  name: "条形码生成",
  category: "generate",
  icon: Barcode,
  description: "在浏览器本地生成常用条形码，支持 SVG 和 PNG 导出",
  keywords: ["条形码", "barcode", "CODE128", "EAN", "商品码"],
};
