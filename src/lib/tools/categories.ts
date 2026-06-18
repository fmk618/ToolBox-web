import {
  ArrowLeftRight,
  Binary,
  Clock,
  FileText,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Palette,
  Settings,
  Wand2,
} from "lucide-react";
import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "convert", label: "文件转换", icon: ArrowLeftRight },
  { id: "codec", label: "编解码", icon: Binary },
  { id: "crypto", label: "加密哈希", icon: KeyRound },
  { id: "text", label: "文本工具", icon: FileText },
  { id: "dev", label: "实用工具", icon: Wand2 },
  { id: "time", label: "时间日期", icon: Clock },
  { id: "data", label: "颜色数据", icon: Palette },
  { id: "web", label: "网络工具", icon: Globe },
  { id: "image", label: "图片处理", icon: ImageIcon },
  { id: "system", label: "系统设置", icon: Settings },
];

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
