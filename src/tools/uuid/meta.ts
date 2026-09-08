import { Fingerprint } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "uuid",
  name: "UUID 生成器",
  category: "generate",
  icon: Fingerprint,
  description: "批量生成 UUID v4",
  keywords: ["uuid", "guid", "v4"],
};
