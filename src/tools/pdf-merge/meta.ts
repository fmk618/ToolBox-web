import { Combine } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "pdf-merge",
  name: "PDF 合并",
  category: "convert",
  icon: Combine,
  description: "多个 PDF 按顺序合成一份，本地处理不上传",
  keywords: ["pdf", "merge", "合并", "拼接"],
};
