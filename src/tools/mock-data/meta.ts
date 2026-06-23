import { Database } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "mock-data",
  name: "Mock 数据",
  category: "dev",
  icon: Database,
  description: "批量生成随机姓名 / 手机 / 邮箱 / UUID / 日期等测试数据",
  keywords: ["mock", "fake", "random", "测试", "数据", "姓名", "手机", "邮箱", "uuid"],
};
