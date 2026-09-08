import { BookOpenCheck } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "http-ref",
  name: "HTTP/端口速查",
  category: "dev",
  icon: BookOpenCheck,
  description: "HTTP 状态码、请求方法、常用端口离线速查表",
  keywords: ["http", "status", "code", "port", "状态码", "端口", " REST"],
};
