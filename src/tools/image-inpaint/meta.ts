import { Wand2 } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "image-inpaint",
  name: "去除水印 · 文字",
  category: "image",
  icon: Wand2,
  description: "涂抹要去除的区域（水印、文字、Logo、AI 标识），算法自动修复背景",
  keywords: ["image", "watermark", "inpaint", "去水印", "水印", "文字", "修复", "logo"],
};
