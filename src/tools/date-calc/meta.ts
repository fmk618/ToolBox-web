import { CalendarClock } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "date-calc",
  name: "日期计算器",
  category: "time",
  icon: CalendarClock,
  description: "两日期间隔、年龄、N 天后是哪天、工作日天数",
  keywords: ["date", "日期", "间隔", "年龄", "天数", "工作日", "倒数"],
};
