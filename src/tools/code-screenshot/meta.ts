import { Camera } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "code-screenshot",
  name: "代码截图",
  category: "dev",
  icon: Camera,
  description: "将代码渲染为带窗口装饰的精美截图并导出 PNG",
  keywords: ["code", "screenshot", "highlight", "carbon", "png", "代码截图", "高亮"],
};
