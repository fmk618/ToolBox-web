export type IPv4InputFormat = "dotted" | "binary" | "hex" | "decimal";

export type IPv4Details = {
  address: string;
  binary: string;
  hex: string;
  decimal: string;
  prefix: number | null;
  cidr: string | null;
  subnetMask: string | null;
  wildcardMask: string | null;
  networkAddress: string | null;
  broadcastAddress: string | null;
  totalAddresses: number | null;
  usableHostRange: string | null;
  usableHostCount: number | null;
};

const OCTET_PATTERN = /^(?:0|[1-9][0-9]{0,2})$/u;
const PREFIX_PATTERN = /^(?:0|[1-9]|[12][0-9]|3[0-2])$/u;
const BINARY_PATTERN = /^[01]{32}$/u;
const GROUPED_BINARY_PATTERN = /^(?:[01]{8}\.){3}[01]{8}$/u;
const HEX_PATTERN = /^(?:0x)?[0-9a-f]{1,8}$/iu;
const DECIMAL_PATTERN = /^(?:0|[1-9][0-9]{0,9})$/u;

export function parseIPv4Address(source: string): number {
  if (typeof source !== "string" || !source.trim()) {
    throw new Error("请输入 IPv4 地址。");
  }
  const parts = source.trim().split(".");
  if (parts.length !== 4) {
    throw new Error("IPv4 地址必须包含四个十进制八位组。");
  }

  const octets = parts.map((part) => {
    if (!OCTET_PATTERN.test(part)) {
      throw new Error("IPv4 八位组必须是 0 到 255 的十进制整数，不能含符号、小数或前导零。");
    }
    const value = Number(part);
    if (value > 255) {
      throw new Error("IPv4 八位组不能大于 255。");
    }
    return value;
  });
  return (((octets[0] * 256 + octets[1]) * 256 + octets[2]) * 256 + octets[3]) >>> 0;
}

export function convertIPv4(source: string, format: IPv4InputFormat = "dotted"): IPv4Details {
  const { address, prefix } = parseInput(source, format);
  const normalizedAddress = formatIPv4(address);
  const details: IPv4Details = {
    address: normalizedAddress,
    binary: formatBinary(address),
    hex: `0x${address.toString(16).padStart(8, "0").toUpperCase()}`,
    decimal: String(address >>> 0),
    prefix,
    cidr: prefix === null ? null : `${normalizedAddress}/${prefix}`,
    subnetMask: null,
    wildcardMask: null,
    networkAddress: null,
    broadcastAddress: null,
    totalAddresses: null,
    usableHostRange: null,
    usableHostCount: null,
  };

  if (prefix === null) return details;

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const network = (address & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);
  let usableHostRange: string;
  let usableHostCount: number;

  if (prefix <= 30) {
    usableHostRange = `${formatIPv4(network + 1)} – ${formatIPv4(broadcast - 1)}`;
    usableHostCount = totalAddresses - 2;
  } else if (prefix === 31) {
    usableHostRange = `${formatIPv4(network)} – ${formatIPv4(broadcast)}`;
    usableHostCount = 2;
  } else {
    usableHostRange = formatIPv4(network);
    usableHostCount = 1;
  }

  details.subnetMask = formatIPv4(mask);
  details.wildcardMask = formatIPv4((~mask) >>> 0);
  details.networkAddress = formatIPv4(network);
  details.broadcastAddress = formatIPv4(broadcast);
  details.totalAddresses = totalAddresses;
  details.usableHostRange = usableHostRange;
  details.usableHostCount = usableHostCount;
  return details;
}

function parseInput(source: string, format: IPv4InputFormat): { address: number; prefix: number | null } {
  if (typeof source !== "string" || !source.trim()) {
    throw new Error("请输入 IPv4 地址。");
  }
  const parts = source.trim().split("/");
  if (parts.length > 2) throw new Error("CIDR 只能包含一个斜杠和一个前缀长度。");

  const address = parseValue(parts[0], format);
  if (parts.length === 1) return { address, prefix: null };
  if (!PREFIX_PATTERN.test(parts[1])) {
    throw new Error("CIDR 前缀必须是 0 到 32 的十进制整数，不能含前导零。");
  }
  return { address, prefix: Number(parts[1]) };
}

function parseValue(source: string, format: IPv4InputFormat): number {
  if (format === "dotted") return parseIPv4Address(source);
  const value = source.trim();

  if (format === "binary") {
    const binary = GROUPED_BINARY_PATTERN.test(value) ? value.replaceAll(".", "") : value;
    if (!BINARY_PATTERN.test(binary)) {
      throw new Error("二进制 IPv4 地址必须是 32 个 0/1 字符，或四组八位二进制。");
    }
    return Number.parseInt(binary, 2) >>> 0;
  }

  if (format === "hex") {
    if (!HEX_PATTERN.test(value)) {
      throw new Error("十六进制 IPv4 地址必须是最多 8 位十六进制字符，可带 0x 前缀。");
    }
    return Number.parseInt(value.replace(/^0x/iu, ""), 16) >>> 0;
  }

  if (!DECIMAL_PATTERN.test(value)) {
    throw new Error("十进制 IPv4 整数必须是 0 到 4294967295，不能含符号或前导零。");
  }
  const decimal = Number(value);
  if (decimal > 0xffffffff) {
    throw new Error("十进制 IPv4 整数不能大于 4294967295。");
  }
  return decimal >>> 0;
}

function formatIPv4(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join(".");
}

function formatBinary(value: number): string {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]
    .map((octet) => octet.toString(2).padStart(8, "0"))
    .join(".");
}
