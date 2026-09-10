import { Table2 } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "csv-table",
  name: "CSV / TSV 表格",
  category: "data",
  icon: Table2,
  description: "在浏览器本地查看、筛选和导出 CSV / TSV 表格",
  keywords: ["csv", "tsv", "表格", "excel", "筛选", "数据"],
};
