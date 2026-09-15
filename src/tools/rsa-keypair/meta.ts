import { KeyRound } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "rsa-keypair",
  name: "RSA 密钥对生成",
  category: "security",
  icon: KeyRound,
  description: "使用浏览器 Web Crypto 本地生成 RSA-OAEP 公钥和私钥 PEM",
  keywords: ["rsa", "key", "public key", "private key", "pem", "密钥", "公钥", "私钥"],
};
