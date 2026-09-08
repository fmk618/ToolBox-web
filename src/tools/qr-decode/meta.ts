import { ScanLine } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "qr-decode",
  name: "二维码解析",
  category: "image",
  icon: ScanLine,
  description: "上传二维码图片，在浏览器本地识别文字、链接或其他内容",
  keywords: ["二维码", "QR", "解析", "识别", "扫码"],
};
