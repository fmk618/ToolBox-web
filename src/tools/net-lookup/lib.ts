// IP 查询 / 域名解析 —— 浏览器无法做原始 DNS / IP 归属地，故走两个公开 HTTPS 接口：
//   · 域名解析：Google DNS-over-HTTPS（dns.google/resolve）
//   · IP 归属地：ipwho.is（免费、无 key、支持 CORS）
// 这两类查询本质需联网；其余工具仍本地优先。

const RECORD_TYPES = [
  { name: "A", code: 1 },
  { name: "AAAA", code: 28 },
  { name: "CNAME", code: 5 },
  { name: "MX", code: 15 },
  { name: "NS", code: 2 },
  { name: "TXT", code: 16 },
];

const TYPE_NAME: Record<number, string> = {
  1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA",
};

export interface DnsRecord {
  type: string;
  name: string;
  ttl: number;
  data: string;
}

export async function resolveDns(
  domain: string,
): Promise<{ records: DnsRecord[]; error?: string }> {
  const d = domain.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!d) return { records: [], error: "请输入域名" };
  try {
    const groups = await Promise.all(
      RECORD_TYPES.map(async (t) => {
        const r = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(d)}&type=${t.code}`,
        );
        const j = await r.json();
        const answers: { name: string; type: number; TTL: number; data: string }[] =
          j.Answer ?? [];
        return answers.map((a) => ({
          type: TYPE_NAME[a.type] ?? String(a.type),
          name: a.name,
          ttl: a.TTL,
          data: a.data,
        }));
      }),
    );
    const records = groups.flat();
    if (records.length === 0)
      return { records: [], error: "未查询到解析记录（域名可能不存在）" };
    return { records };
  } catch {
    return { records: [], error: "解析失败，请检查网络或域名" };
  }
}

export interface IpInfo {
  ip: string;
  type: string;
  flag: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lng: number;
  isp: string;
  org: string;
  asn: string;
  timezone: string;
  utc: string;
}

export async function lookupIp(
  ip: string,
): Promise<{ info?: IpInfo; error?: string }> {
  try {
    const r = await fetch(`https://ipwho.is/${encodeURIComponent(ip.trim())}`);
    const j = await r.json();
    if (!j.success) return { error: j.message || "查询失败，请检查输入" };
    return {
      info: {
        ip: j.ip,
        type: j.type,
        flag: j.flag?.emoji ?? "",
        country: j.country,
        countryCode: j.country_code,
        region: j.region,
        city: j.city,
        lat: j.latitude,
        lng: j.longitude,
        isp: j.connection?.isp ?? "",
        org: j.connection?.org ?? "",
        asn: j.connection?.asn ? `AS${j.connection.asn}` : "",
        timezone: j.timezone?.id ?? "",
        utc: j.timezone?.utc ?? "",
      },
    };
  } catch {
    return { error: "查询失败，请检查网络" };
  }
}
