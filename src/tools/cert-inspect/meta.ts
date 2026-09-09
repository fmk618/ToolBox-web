import { ShieldCheck } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "cert-inspect",
  name: "X.509 证书检查",
  category: "security",
  icon: ShieldCheck,
  description: "在浏览器本地查看公开证书或 CSR 的主体、用途和 SHA-256 指纹",
  keywords: ["x509", "证书", "certificate", "csr", "pem", "der", "ssl", "tls", "指纹", "san"],
};
