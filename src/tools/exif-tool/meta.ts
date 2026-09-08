import { ImageMinus } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "exif-tool",
  name: "EXIF 查看/清除",
  category: "image",
  icon: ImageMinus,
  description: "查看 JPEG 拍摄信息，并通过本地重编码清除图片元数据",
  keywords: ["EXIF", "元数据", "隐私", "照片", "GPS", "清除"],
};
