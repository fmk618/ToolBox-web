import { Globe2 } from "lucide-react";
import type { ToolMeta } from "../../lib/tools/types";

export const meta: ToolMeta = {
  slug: "net-lookup",
  name: "IP 查询 / 域名解析",
  category: "web",
  icon: Globe2,
  description: "查 IP 归属地 / 运营商，解析域名 DNS（A/AAAA/MX/NS/TXT/CNAME）",
  keywords: ["ip", "ip查询", "归属地", "dns", "域名解析", "nslookup", "whois"],
};
