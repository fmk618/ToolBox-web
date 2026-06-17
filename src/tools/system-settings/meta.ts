import { Settings } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "settings",
  name: "系统设置",
  category: "system",
  icon: Settings,
  description: "后端地址、AI 模型 (Vision LLM) 配置、本地数据",
  keywords: ["settings", "config", "llm", "设置"],
};
