import { Binary } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "base64",
  name: "Base64 编/解码",
  category: "codec",
  icon: Binary,
  description: "在文本与 Base64 之间互转",
  keywords: ["base64", "encode", "decode", "编码", "解码"],
};
