import { Link2 } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "url-codec",
  name: "URL 编/解码",
  category: "codec",
  icon: Link2,
  description: "encodeURIComponent / decodeURIComponent",
  keywords: ["url", "percent", "encode"],
};
