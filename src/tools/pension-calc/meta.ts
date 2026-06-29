import { CalendarClock } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "pension-calc",
  name: "养老计算器",
  category: "dev",
  icon: CalendarClock,
  description: "中国延迟退休：按出生年月 + 性别 / 岗位推算法定退休年龄与时间",
  keywords: [
    "养老",
    "退休",
    "延迟退休",
    "法定退休年龄",
    "pension",
    "retirement",
    "缴费年限",
  ],
};
