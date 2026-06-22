import { Calculator } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "calculator",
  name: "计算器",
  category: "dev",
  icon: Calculator,
  description: "支持四则运算 + 括号 + 百分比 + 键盘输入",
  keywords: ["calculator", "calc", "计算", "算术"],
};
