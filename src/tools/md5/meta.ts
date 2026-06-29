import { Fingerprint } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "md5",
  name: "MD5 加密/解密",
  category: "crypto",
  icon: Fingerprint,
  description: "MD5 加密（32/16 位、大小写、加盐）+ 本地字典 / 暴力反查",
  keywords: ["md5", "hash", "加密", "解密", "摘要", "反查", "暴力破解"],
};
