import { Trophy } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "raffle",
  name: "随机抽奖",
  category: "dev",
  icon: Trophy,
  description: "输入名单，公平随机抽取获奖者，支持多次抽取与结果记录",
  keywords: ["抽奖", "随机", "名单", "winner", "raffle", "摇号"],
};
