import { Clapperboard } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "gif-frames",
  name: "GIF 帧提取器",
  category: "image",
  icon: Clapperboard,
  description: "按正确的动画帧顺序提取 GIF，并在浏览器本地导出 PNG",
  keywords: ["gif", "动图", "帧", "提取", "png", "动画"],
};
