import { QrCode } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "qrcode",
  name: "二维码生成",
  category: "qrcode",
  icon: QrCode,
  description: "文本/URL/WiFi 转 QR，支持密码分享与微信 HTTPS 扫码",
  keywords: ["qr", "qrcode", "二维码", "密码分享", "微信扫码", "加密二维码"],
};
