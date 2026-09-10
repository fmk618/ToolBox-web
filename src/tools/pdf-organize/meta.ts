import { FileCog } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "pdf-organize",
  name: "PDF 页面整理",
  category: "file",
  icon: FileCog,
  description: "重排、旋转或删除 PDF 页面，全程在浏览器本地完成",
  keywords: ["pdf", "页面", "重排", "旋转", "删除", "organize"],
};
