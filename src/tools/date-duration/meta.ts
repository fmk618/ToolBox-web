import { CalendarRange } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "date-duration",
  name: "日期间隔计算",
  category: "time",
  icon: CalendarRange,
  description: "计算两个日期之间的天数、工作日和精确时长",
  keywords: ["日期", "时间间隔", "工作日", "倒计时", "duration", "date"],
};
