const VERSION = "fmkqr1";
const SALT_BYTES = 16;
const IV_BYTES = 12;
const MAX_PLAINTEXT_BYTES = 256;
const MAX_CIPHERTEXT_BYTES = MAX_PLAINTEXT_BYTES + 16;
const PBKDF2_ITERATIONS = 600_000;
const AAD_TEXT = "FMKTools QR Share v1";
const BASE64URL = /^[A-Za-z0-9_-]+$/;

export const SECURE_QR_MAX_PLAINTEXT_BYTES = MAX_PLAINTEXT_BYTES;
export const SECURE_QR_MIN_PASSWORD_LENGTH = 12;

export class SecureQrShareError extends Error {}

function getWebCrypto(): Crypto {
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !globalThis.crypto?.subtle
  ) {
    throw new SecureQrShareError("当前环境不支持安全的本地加密");
  }
  return globalThis.crypto;
}

function bytesToBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!BASE64URL.test(value)) {
    throw new SecureQrShareError("链接格式无效");
  }
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new SecureQrShareError("链接格式无效");
  }
}

async function deriveKey(
  cryptoApi: Crypto,
  password: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const normalized = password.normalize("NFC");
  const material = await cryptoApi.subtle.importKey(
    "raw",
    bytesToBuffer(new TextEncoder().encode(normalized)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return cryptoApi.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: bytesToBuffer(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function isWebCryptoAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    Boolean(globalThis.crypto?.subtle)
  );
}

export async function createProtectedFragment(
  plaintext: string,
  password: string,
): Promise<string> {
  const plaintextBytes = new TextEncoder().encode(plaintext);
  if (!plaintextBytes.byteLength) {
    throw new SecureQrShareError("请输入需要保护的内容");
  }
  if (plaintextBytes.byteLength > MAX_PLAINTEXT_BYTES) {
    throw new SecureQrShareError(`内容最多 ${MAX_PLAINTEXT_BYTES} 字节`);
  }
  const normalizedPassword = password.normalize("NFC");
  if (Array.from(normalizedPassword).length < SECURE_QR_MIN_PASSWORD_LENGTH) {
    throw new SecureQrShareError(`密码至少 ${SECURE_QR_MIN_PASSWORD_LENGTH} 个字符`);
  }

  const cryptoApi = getWebCrypto();
  const salt = cryptoApi.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = cryptoApi.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(cryptoApi, password, salt);
  const encrypted = await cryptoApi.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: bytesToBuffer(iv),
      additionalData: bytesToBuffer(new TextEncoder().encode(AAD_TEXT)),
    },
    key,
    bytesToBuffer(plaintextBytes),
  );

  return `${VERSION}.${toBase64Url(salt)}.${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encrypted))}`;
}

function parseProtectedFragment(hash: string): {
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
} {
  const fragment = hash.startsWith("#") ? hash.slice(1) : hash;
  const [version, saltValue, ivValue, ciphertextValue, ...rest] = fragment.split(".");
  if (
    version !== VERSION ||
    rest.length > 0 ||
    !saltValue ||
    !ivValue ||
    !ciphertextValue
  ) {
    throw new SecureQrShareError("链接格式无效");
  }

  const salt = fromBase64Url(saltValue);
  const iv = fromBase64Url(ivValue);
  const ciphertext = fromBase64Url(ciphertextValue);
  if (
    salt.byteLength !== SALT_BYTES ||
    iv.byteLength !== IV_BYTES ||
    ciphertext.byteLength < 16 ||
    ciphertext.byteLength > MAX_CIPHERTEXT_BYTES
  ) {
    throw new SecureQrShareError("链接格式无效");
  }
  return { salt, iv, ciphertext };
}

export async function decryptProtectedFragment(
  hash: string,
  password: string,
): Promise<string> {
  const cryptoApi = getWebCrypto();
  try {
    const { salt, iv, ciphertext } = parseProtectedFragment(hash);
    const key = await deriveKey(cryptoApi, password, salt);
    const plaintext = await cryptoApi.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytesToBuffer(iv),
        additionalData: bytesToBuffer(new TextEncoder().encode(AAD_TEXT)),
      },
      key,
      bytesToBuffer(ciphertext),
    );
    return new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
  } catch {
    throw new SecureQrShareError("密码错误或链接已损坏");
  }
}

export function getSecureShareBaseUrl(): { url?: string; error?: string } {
  const configured = process.env.NEXT_PUBLIC_SHARE_BASE_URL;
  if (!configured) {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      return { url: new URL("share", `${window.location.origin}/`).toString() };
    }
    return { error: "未配置公开分享地址 NEXT_PUBLIC_SHARE_BASE_URL" };
  }

  try {
    const base = new URL(configured);
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    ) {
      throw new Error("invalid base URL");
    }
    const normalized = new URL(base.toString());
    if (!normalized.pathname.endsWith("/")) normalized.pathname += "/";
    return { url: new URL("share", normalized).toString() };
  } catch {
    return { error: "公开分享地址必须是无参数的 HTTPS 地址" };
  }
}
