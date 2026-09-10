import { CalendarPlus } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "ics-generate",
  name: "日历事件生成器",
  category: "time",
  icon: CalendarPlus,
  description: "生成可导入 Apple、Google 和 Outlook 日历的 ICS 事件",
  keywords: ["ics", "日历", "calendar", "提醒", "重复", "事件"],
};
