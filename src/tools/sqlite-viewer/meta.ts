import { Database } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "sqlite-viewer",
  name: "SQLite 数据库浏览器",
  category: "data",
  icon: Database,
  description: "在独立 Worker 中本地浏览 SQLite 表、只读查询并导出 CSV",
  keywords: ["sqlite", "数据库", "db", "sql", "查询", "csv", "浏览器"],
};
