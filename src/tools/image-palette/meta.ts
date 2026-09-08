import { Pipette } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "image-palette",
  name: "图片取色板",
  category: "image",
  icon: Pipette,
  description: "点击图片精确取色，并自动提取主色调配色板",
  keywords: ["取色", "颜色", "调色板", "palette", "图片"],
};
