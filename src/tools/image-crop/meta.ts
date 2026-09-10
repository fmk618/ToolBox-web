import { Crop } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "image-crop",
  name: "图片裁剪与旋转",
  category: "image",
  icon: Crop,
  description: "本地裁剪、旋转、翻转图片并导出 PNG、JPG 或 WebP",
  keywords: ["图片", "裁剪", "旋转", "翻转", "头像", "crop"],
};
