import { MapPinned } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "address-gen",
  name: "地址生成器",
  category: "dev",
  icon: MapPinned,
  description: "随机生成虚构姓名 / 地址 / 电话（美国 / 新加坡 / 英国），供测试占位",
  keywords: ["地址", "address", "美国地址", "假地址", "随机", "测试", "生成器"],
};
