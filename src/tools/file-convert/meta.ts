import { ArrowLeftRight } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "file-convert",
  name: "文件格式转换",
  category: "convert",
  icon: ArrowLeftRight,
  description: "PDF · Word · Markdown · HTML 等格式互转",
  keywords: ["convert", "pdf", "docx", "markdown", "转换"],
};
