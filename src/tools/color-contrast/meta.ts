import { Contrast } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "color-contrast",
  name: "颜色对比度",
  category: "data",
  icon: Contrast,
  description: "WCAG AA/AAA 对比度评估（WebAIM 算法）",
  keywords: ["color", "contrast", "wcag", "a11y", "对比度"],
};
