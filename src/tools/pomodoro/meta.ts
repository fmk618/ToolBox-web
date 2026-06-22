import { Timer } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "pomodoro",
  name: "番茄钟",
  category: "time",
  icon: Timer,
  description: "25 分钟专注 + 5 分钟休息，每 4 个周期长休息",
  keywords: ["pomodoro", "timer", "番茄", "专注"],
};
