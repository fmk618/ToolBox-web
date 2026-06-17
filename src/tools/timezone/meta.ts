import { Globe } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "timezone",
  name: "时区换算",
  category: "time",
  icon: Globe,
  description: "多城市同时刻对照（worldtimebuddy 启发）",
  keywords: ["timezone", "tz", "utc", "world", "时区"],
};
