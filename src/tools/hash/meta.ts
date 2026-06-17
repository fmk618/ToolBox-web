import { KeyRound } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "hash",
  name: "Hash 计算",
  category: "crypto",
  icon: KeyRound,
  description: "SHA-1 / SHA-256 / SHA-384 / SHA-512（基于 Web Crypto）",
  keywords: ["hash", "sha", "digest"],
};
