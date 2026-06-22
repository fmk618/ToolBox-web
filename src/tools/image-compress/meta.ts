import { ImageDown } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "image-compress",
  name: "图片压缩",
  category: "image",
  icon: ImageDown,
  description: "本地压缩 JPEG / PNG / WebP，体积锐降不上传",
  keywords: ["image", "compress", "压缩", "图片"],
};
