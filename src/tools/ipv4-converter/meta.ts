import { Network } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "ipv4-converter",
  name: "IPv4 地址转换",
  category: "network",
  icon: Network,
  description: "转换 IPv4 表示并计算 CIDR 子网、网络与广播地址",
  keywords: ["ipv4", "ip", "cidr", "subnet", "network", "broadcast", "IPv4", "子网", "掩码"],
};
