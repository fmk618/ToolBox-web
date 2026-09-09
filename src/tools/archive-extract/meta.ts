import { ArchiveRestore } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "archive-extract",
  name: "压缩包查看与解压",
  category: "file",
  icon: ArchiveRestore,
  description: "查看 ZIP/GZIP 内容，按条目安全解压并下载",
  keywords: ["zip", "gzip", "tgz", "解压", "压缩包", "archive"],
};
