export const MAX_CERTIFICATE_BYTES = 2 * 1024 * 1024;

const CERTIFICATE_REQUEST_ATTRIBUTE = "1.2.840.113549.1.9.14";
const SUBJECT_ALT_NAME = "2.5.29.17";
const KEY_USAGE = "2.5.29.15";
const EXTENDED_KEY_USAGE = "2.5.29.37";
const BASIC_CONSTRAINTS = "2.5.29.19";

const DISTINGUISHED_NAME_LABELS: Record<string, string> = {
  "2.5.4.3": "CN",
  "2.5.4.4": "SN",
  "2.5.4.5": "序列号",
  "2.5.4.6": "C",
  "2.5.4.7": "L",
  "2.5.4.8": "ST",
  "2.5.4.9": "街道地址",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.12": "标题",
  "2.5.4.42": "名",
  "1.2.840.113549.1.9.1": "邮箱",
};

const ALGORITHM_LABELS: Record<string, string> = {
  "1.2.840.113549.1.1.1": "RSA",
  "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption",
  "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
  "1.2.840.113549.1.1.13": "sha512WithRSAEncryption",
  "1.2.840.10045.2.1": "EC 公钥",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256",
  "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
  "1.2.840.10045.4.3.4": "ecdsa-with-SHA512",
  "1.3.101.112": "Ed25519",
  "1.3.101.113": "Ed448",
};

const EXTENDED_KEY_USAGE_LABELS: Record<string, string> = {
  "1.3.6.1.5.5.7.3.1": "TLS 服务器认证",
  "1.3.6.1.5.5.7.3.2": "TLS 客户端认证",
  "1.3.6.1.5.5.7.3.3": "代码签名",
  "1.3.6.1.5.5.7.3.4": "电子邮件保护",
  "1.3.6.1.5.5.7.3.8": "时间戳",
  "1.3.6.1.5.5.7.3.9": "OCSP 签名",
  "2.5.29.37.0": "任意扩展用途",
};

const KEY_USAGE_LABELS = [
  "数字签名",
  "不可否认",
  "密钥加密",
  "数据加密",
  "密钥协商",
  "证书签名",
  "CRL 签名",
  "仅加密",
  "仅解密",
] as const;

export type CertificateKind = "certificate" | "csr";

export type DistinguishedNameItem = {
  label: string;
  oid: string;
  value: string;
};

export type Algorithm = {
  oid: string;
  name: string;
};

export type CertificateInspection = {
  kind: CertificateKind;
  subject: DistinguishedNameItem[];
  issuer: DistinguishedNameItem[];
  serialNumber: string | null;
  validFrom: string | null;
  validTo: string | null;
  fingerprintSha256: string;
  subjectAlternativeNames: string[];
  keyUsage: string[];
  extendedKeyUsage: string[];
  basicConstraints: string | null;
  publicKeyAlgorithm: Algorithm;
  signatureAlgorithm: Algorithm;
};

export function isCertificateFile(file: File): boolean {
  return /\.(?:cer|cert|crt|der|pem|csr)$/iu.test(file.name) ||
    /(?:pkix-cert|x-x509-ca-cert|pkcs10|x-pem-file)/iu.test(file.type);
}

export async function inspectCertificate(file: File): Promise<CertificateInspection> {
  if (!file.size) throw new Error("证书文件为空。");
  if (file.size > MAX_CERTIFICATE_BYTES) {
    throw new Error("证书或 CSR 文件不能超过 2 MB。");
  }
  return inspectCertificateData(await file.arrayBuffer());
}

export async function inspectCertificateData(source: ArrayBuffer): Promise<CertificateInspection> {
  const der = decodePemOrDer(source);
  const [{ fromBER }, { Certificate, CertificationRequest, Extensions }] = await Promise.all([
    import("asn1js"),
    import("pkijs"),
  ]);
  const asn1 = fromBER(der);
  if (asn1.offset === -1) {
    throw new Error("文件不是有效的 DER 或 PEM ASN.1 数据。");
  }

  const fingerprintSha256 = await sha256Fingerprint(der);
  try {
    const certificate = new Certificate({ schema: asn1.result });
    return toCertificateInspection(certificate as unknown as Record<string, unknown>, fingerprintSha256);
  } catch {
    try {
      const request = new CertificationRequest({ schema: asn1.result });
      return toRequestInspection(request as unknown as Record<string, unknown>, fingerprintSha256, Extensions);
    } catch {
      throw new Error("无法识别此文件。仅支持公开 X.509 证书和证书签名请求（CSR）。");
    }
  }
}

function decodePemOrDer(source: ArrayBuffer): ArrayBuffer {
  const bytes = new Uint8Array(source);
  const preview = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 16 * 1024)));
  if (/-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----/iu.test(preview)) {
    throw new Error("为保护私钥，此工具不接受私钥文件。请仅上传公开证书或 CSR。");
  }
  if (!preview.includes("-----BEGIN")) return source;

  const match = preview.match(
    /^\s*-----BEGIN (CERTIFICATE|X509 CERTIFICATE|CERTIFICATE REQUEST|NEW CERTIFICATE REQUEST)-----\s*([\s\S]*?)\s*-----END \1-----\s*$/u,
  );
  if (!match) {
    throw new Error("PEM 文件应只包含一个公开证书或 CSR 区块。");
  }
  const body = match[2].replace(/\s/gu, "");
  if (!body || !/^[A-Za-z0-9+/]*={0,2}$/u.test(body)) {
    throw new Error("PEM 的 Base64 内容无效。");
  }
  try {
    const binary = atob(body);
    const der = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) der[index] = binary.charCodeAt(index);
    return der.buffer;
  } catch {
    throw new Error("PEM 的 Base64 内容无效。");
  }
}

function toCertificateInspection(certificate: Record<string, unknown>, fingerprintSha256: string): CertificateInspection {
  const extensions = getArray(certificate.extensions);
  return {
    kind: "certificate",
    subject: formatDistinguishedName(certificate.subject),
    issuer: formatDistinguishedName(certificate.issuer),
    serialNumber: integerToHex(certificate.serialNumber),
    validFrom: timeToIso(certificate.notBefore),
    validTo: timeToIso(certificate.notAfter),
    fingerprintSha256,
    subjectAlternativeNames: extractSubjectAlternativeNames(extensions),
    keyUsage: extractKeyUsage(extensions),
    extendedKeyUsage: extractExtendedKeyUsage(extensions),
    basicConstraints: extractBasicConstraints(extensions),
    publicKeyAlgorithm: formatAlgorithm(getRecord(certificate.subjectPublicKeyInfo)?.algorithm),
    signatureAlgorithm: formatAlgorithm(certificate.signatureAlgorithm),
  };
}

function toRequestInspection(
  request: Record<string, unknown>,
  fingerprintSha256: string,
  Extensions: new (parameters: { schema: unknown }) => { extensions: unknown[] },
): CertificateInspection {
  const attributes = getArray(request.attributes);
  const extensionRequest = attributes.find((attribute) => getRecord(attribute)?.type === CERTIFICATE_REQUEST_ATTRIBUTE);
  let extensions: unknown[] = [];
  const values = getArray(getRecord(extensionRequest)?.values);
  if (values[0]) {
    try {
      extensions = new Extensions({ schema: values[0] }).extensions;
    } catch {
      // A malformed optional extension request does not prevent inspection of the public CSR.
    }
  }

  return {
    kind: "csr",
    subject: formatDistinguishedName(request.subject),
    issuer: [],
    serialNumber: null,
    validFrom: null,
    validTo: null,
    fingerprintSha256,
    subjectAlternativeNames: extractSubjectAlternativeNames(extensions),
    keyUsage: extractKeyUsage(extensions),
    extendedKeyUsage: extractExtendedKeyUsage(extensions),
    basicConstraints: extractBasicConstraints(extensions),
    publicKeyAlgorithm: formatAlgorithm(getRecord(request.subjectPublicKeyInfo)?.algorithm),
    signatureAlgorithm: formatAlgorithm(request.signatureAlgorithm),
  };
}

function formatDistinguishedName(value: unknown): DistinguishedNameItem[] {
  return getArray(getRecord(value)?.typesAndValues).map((entry) => {
    const record = getRecord(entry);
    const oid = typeof record?.type === "string" ? record.type : "未知";
    return {
      oid,
      label: DISTINGUISHED_NAME_LABELS[oid] ?? oid,
      value: stringValue(record?.value),
    };
  });
}

function formatAlgorithm(value: unknown): Algorithm {
  const record = getRecord(value);
  const oid = typeof record?.algorithmId === "string" ? record.algorithmId : "未知";
  return { oid, name: ALGORITHM_LABELS[oid] ?? oid };
}

function extractSubjectAlternativeNames(extensions: unknown[]): string[] {
  const names = getRecord(findExtension(extensions, SUBJECT_ALT_NAME)?.parsedValue)?.altNames;
  return getArray(names).map(formatGeneralName).filter((value): value is string => Boolean(value));
}

function formatGeneralName(value: unknown): string | null {
  const name = getRecord(value);
  const type = name?.type;
  const raw = name?.value;
  if (type === 1) return `邮箱: ${stringValue(raw)}`;
  if (type === 2) return `DNS: ${stringValue(raw)}`;
  if (type === 6) return `URI: ${stringValue(raw)}`;
  if (type === 7) return `IP: ${formatIpAddress(raw)}`;
  if (type === 4) {
    const items = formatDistinguishedName(raw);
    return items.length ? `目录名: ${items.map((item) => `${item.label}=${item.value}`).join(", ")}` : null;
  }
  if (type === 8) return `注册 ID: ${stringValue(raw)}`;
  return `通用名称类型 ${String(type)}: ${stringValue(raw)}`;
}

function extractKeyUsage(extensions: unknown[]): string[] {
  const value = getRecord(findExtension(extensions, KEY_USAGE)?.parsedValue);
  const bytes = toBytes(getRecord(value?.valueBlock)?.valueHexView);
  const usages: string[] = [];
  for (let index = 0; index < KEY_USAGE_LABELS.length; index += 1) {
    if (bytes[Math.floor(index / 8)] & (1 << (7 - (index % 8)))) usages.push(KEY_USAGE_LABELS[index]);
  }
  return usages;
}

function extractExtendedKeyUsage(extensions: unknown[]): string[] {
  const purposes = getArray(getRecord(findExtension(extensions, EXTENDED_KEY_USAGE)?.parsedValue)?.keyPurposes);
  return purposes.map((value) => {
    const oid = typeof value === "string" ? value : "未知";
    return EXTENDED_KEY_USAGE_LABELS[oid] ? `${EXTENDED_KEY_USAGE_LABELS[oid]} (${oid})` : oid;
  });
}

function extractBasicConstraints(extensions: unknown[]): string | null {
  const value = getRecord(findExtension(extensions, BASIC_CONSTRAINTS)?.parsedValue);
  if (!value) return null;
  const certificateAuthority = value.cA === true;
  const pathLength = typeof value.pathLenConstraint === "number" ? `，路径长度 ${value.pathLenConstraint}` : "";
  return certificateAuthority ? `CA 证书${pathLength}` : "终端实体证书";
}

function findExtension(extensions: unknown[], oid: string): Record<string, unknown> | null {
  return getRecord(extensions.find((extension) => getRecord(extension)?.extnID === oid)) ?? null;
}

function integerToHex(value: unknown): string | null {
  const bytes = toBytes(getRecord(getRecord(value)?.valueBlock)?.valueHexView);
  return bytes.length ? bytesToHex(bytes) : null;
}

function timeToIso(value: unknown): string | null {
  const date = getRecord(value)?.value;
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value;
  const text = getRecord(value)?.valueBlock;
  if (typeof getRecord(text)?.value === "string") return getRecord(text)?.value as string;
  if (value && typeof (value as { toString?: () => string }).toString === "function") {
    return (value as { toString: () => string }).toString();
  }
  return "";
}

function formatIpAddress(value: unknown): string {
  const bytes = toBytes(getRecord(getRecord(value)?.valueBlock)?.valueHexView);
  if (bytes.length === 4) return Array.from(bytes).join(".");
  if (bytes.length === 16) return formatIpv6(bytes);
  return bytes.length ? bytesToHex(bytes) : "未知";
}

function formatIpv6(bytes: Uint8Array): string {
  const groups = Array.from({ length: 8 }, (_, index) => (bytes[index * 2] * 256 + bytes[index * 2 + 1]).toString(16));
  let bestStart = -1;
  let bestLength = 0;
  let start = -1;
  for (let index = 0; index <= groups.length; index += 1) {
    if (index < groups.length && groups[index] === "0") {
      if (start < 0) start = index;
    } else if (start >= 0) {
      const length = index - start;
      if (length > bestLength) {
        bestStart = start;
        bestLength = length;
      }
      start = -1;
    }
  }
  if (bestLength < 2) return groups.join(":");
  const before = groups.slice(0, bestStart).join(":");
  const after = groups.slice(bestStart + bestLength).join(":");
  return before && after ? `${before}::${after}` : before ? `${before}::` : `::${after}`;
}

async function sha256Fingerprint(source: ArrayBuffer): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error("当前浏览器不支持 Web Crypto，无法计算 SHA-256 指纹。");
  const hash = await globalThis.crypto.subtle.digest("SHA-256", source);
  return bytesToHex(new Uint8Array(hash));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0").toUpperCase()).join(":");
}

function toBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  return new Uint8Array();
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}
