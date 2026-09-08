// IP 查询 / 域名解析 —— 浏览器无法做原始 DNS / IP 归属地，故走公开 HTTPS 接口：
//   · 域名解析：Cloudflare DNS-over-HTTPS 主服务，Google DNS-over-HTTPS 备用
//   · IP 归属地：ipwho.is（免费、无 key、支持 CORS）
// 这两类查询本质需联网；其余工具仍本地优先。

const DNS_TIMEOUT_MS = 5_000;

const DNS_PROVIDERS = {
  cloudflare: "https://cloudflare-dns.com/dns-query",
  google: "https://dns.google/resolve",
} as const;

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

interface DnsAnswerPayload {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DnsRecord {
  type: string;
  name: string;
  ttl: number;
  data: string;
}

function normalizeDomain(input: string): string {
  const value = input.trim();
  if (!value) return "";

  try {
    const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(value);
    const url = new URL(hasProtocol ? value : `https://${value}`);
    if (hasProtocol && url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.hostname;
  } catch {
    return "";
  }
}

function parseDnsAnswers(payload: unknown): DnsRecord[] {
  if (!payload || typeof payload !== "object") throw new Error("Invalid DNS response");

  const response = payload as { Status?: unknown; Answer?: unknown };
  if (typeof response.Status !== "number" || !Number.isFinite(response.Status)) {
    throw new Error("Invalid DNS status");
  }

  // NOERROR (NODATA included) and NXDOMAIN are valid terminal answers.
  // Other DNS errors are retried through the fallback resolver.
  if (response.Status !== 0 && response.Status !== 3) {
    throw new Error(`DNS resolver error: ${response.Status}`);
  }
  if (response.Answer === undefined) return [];
  if (!Array.isArray(response.Answer)) throw new Error("Invalid DNS answers");

  return response.Answer.map((answer) => {
    if (!answer || typeof answer !== "object") throw new Error("Invalid DNS answer");
    const value = answer as Partial<DnsAnswerPayload>;
    if (
      typeof value.name !== "string" ||
      typeof value.type !== "number" ||
      !Number.isFinite(value.type) ||
      typeof value.TTL !== "number" ||
      !Number.isFinite(value.TTL) ||
      value.TTL < 0 ||
      typeof value.data !== "string"
    ) {
      throw new Error("Invalid DNS answer");
    }
    return {
      type: TYPE_NAME[value.type] ?? String(value.type),
      name: value.name,
      ttl: value.TTL,
      data: value.data,
    };
  });
}

async function queryDns(
  provider: (typeof DNS_PROVIDERS)[keyof typeof DNS_PROVIDERS],
  domain: string,
  type: number,
): Promise<DnsRecord[]> {
  const url = new URL(provider);
  url.search = new URLSearchParams({ name: domain, type: String(type) }).toString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DNS_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`DNS request failed: ${response.status}`);
    return parseDnsAnswers(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

async function queryDnsWithFallback(domain: string, type: number): Promise<DnsRecord[]> {
  try {
    return await queryDns(DNS_PROVIDERS.cloudflare, domain, type);
  } catch {
    return queryDns(DNS_PROVIDERS.google, domain, type);
  }
}

export async function resolveDns(
  domain: string,
): Promise<{ records: DnsRecord[]; error?: string }> {
  const d = normalizeDomain(domain);
  if (!d) return { records: [], error: "请输入有效域名" };
  try {
    const groups = await Promise.all(
      RECORD_TYPES.map((type) => queryDnsWithFallback(d, type.code)),
    );
    const records = groups.flat();
    if (records.length === 0) {
      return { records: [], error: "未查询到解析记录（域名可能不存在）" };
    }
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
