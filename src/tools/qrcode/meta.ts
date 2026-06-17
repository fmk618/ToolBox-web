import { QrCode } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "qrcode",
  name: "二维码生成",
  category: "image",
  icon: QrCode,
  description: "文本/URL/WiFi 转 QR，可调纠错与尺寸",
  keywords: ["qr", "qrcode", "二维码"],
};
