import { FileCode2 } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "svg-min",
  name: "SVG 优化",
  category: "image",
  icon: FileCode2,
  description: "移除注释与冗余属性，压缩 SVG 体积，即时预览",
  keywords: ["svg", "optimize", "minify", "compress", "压缩", "优化", "矢量图"],
};
