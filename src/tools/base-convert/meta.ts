import { Hash } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "base-convert",
  name: "进制转换",
  category: "dev",
  icon: Hash,
  description: "二进制 / 八进制 / 十进制 / 十六进制互转",
  keywords: ["binary", "hex", "octal", "decimal", "进制", "base", "转换", "二进制", "十六进制"],
};
