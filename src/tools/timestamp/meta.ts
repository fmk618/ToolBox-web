import { Clock } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "timestamp",
  name: "时间戳转换",
  category: "time",
  icon: Clock,
  description: "Unix 时间戳 ↔ 本地时间 / UTC / ISO 8601",
  keywords: ["timestamp", "unix", "epoch", "时间"],
};
