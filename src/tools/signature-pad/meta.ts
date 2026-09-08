import { Signature } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "signature-pad",
  name: "电子签名板",
  category: "design",
  icon: Signature,
  description: "在浏览器中手写签名，导出透明 PNG 或白底 JPG",
  keywords: ["签名", "电子签名", "手写", "signature", "png"],
};
