import { ImagePlus } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "favicon-generator",
  name: "网站图标生成",
  category: "image",
  icon: ImagePlus,
  description: "在浏览器本地生成 favicon 和常用应用图标",
  keywords: ["favicon", "icon", "图标", "网站图标", "png", "ico"],
};
