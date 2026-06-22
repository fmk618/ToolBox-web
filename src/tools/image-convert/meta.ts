import { Images } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "image-convert",
  name: "图片格式转换",
  category: "image",
  icon: Images,
  description: "JPG / PNG / WebP / AVIF / GIF / BMP / TIFF / ICO 互转",
  keywords: ["image", "convert", "转换", "图片", "jpg", "png", "webp", "avif"],
};
