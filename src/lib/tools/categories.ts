import {
  AlignLeft,
  Binary,
  Calculator,
  Clock,
  Code2,
  Database,
  FileText,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Palette,
  QrCode,
  Settings,
  Wand2,
} from "lucide-react";
import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "file", label: "文件处理", icon: FileText },
  { id: "codec", label: "编解码", icon: Binary },
  { id: "text", label: "文本处理", icon: AlignLeft },
  { id: "data", label: "数据处理", icon: Database },
  { id: "developer", label: "开发辅助", icon: Code2 },
  { id: "security", label: "加密安全", icon: KeyRound },
  { id: "generate", label: "生成与随机", icon: Wand2 },
  { id: "calculate", label: "计算与换算", icon: Calculator },
  { id: "time", label: "日期与时间", icon: Clock },
  { id: "image", label: "图片处理", icon: ImageIcon },
  { id: "design", label: "颜色与设计", icon: Palette },
  { id: "qrcode", label: "二维码工具", icon: QrCode },
  { id: "network", label: "网络工具", icon: Globe },
  { id: "system", label: "系统设置", icon: Settings },
];

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
