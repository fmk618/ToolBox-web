import { Scissors } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "pdf-split",
  name: "PDF 拆分",
  category: "convert",
  icon: Scissors,
  description: "按页码提取 PDF 指定页面，本地处理不上传",
  keywords: ["pdf", "split", "拆分", "提取", "页", "page"],
};
