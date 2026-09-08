import { Palette } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "color",
  name: "颜色转换",
  category: "design",
  icon: Palette,
  description: "Hex ↔ RGB ↔ HSL",
  keywords: ["color", "hex", "rgb", "hsl", "颜色"],
};
