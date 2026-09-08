import { CircleDollarSign } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "exchange-rate",
  name: "汇率换算",
  category: "calculate",
  icon: CircleDollarSign,
  description: "使用公开参考汇率，实时换算常见货币",
  keywords: ["汇率", "货币", "美元", "人民币", "exchange", "currency"],
};
