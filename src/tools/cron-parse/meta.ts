import { Repeat } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "cron-parse",
  name: "Cron 表达式",
  category: "time",
  icon: Repeat,
  description: "解析 Cron 并预测下 5 次触发（crontab.guru 启发）",
  keywords: ["cron", "schedule", "crontab"],
};
