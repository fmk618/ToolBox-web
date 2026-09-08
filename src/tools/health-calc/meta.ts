import { HeartPulse } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "health-calc",
  name: "健康计算器",
  category: "calculate",
  icon: HeartPulse,
  description: "计算 BMI、健康体重范围、基础代谢和每日热量估算",
  keywords: ["健康", "BMI", "体重", "热量", "基础代谢", "BMR"],
};
