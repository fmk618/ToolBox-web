// MD5 (RFC 1321) — self-contained, operates on UTF-8 bytes so 中文 hashes
// correctly. Web Crypto's SubtleCrypto does NOT support MD5, hence this impl.
// MD5 is a one-way hash: there is no real "decrypt". The reverse helpers below
// are honest best-effort — a built-in common-password dictionary plus a bounded
// brute-force — both run entirely in the browser.

const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
  9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
  16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

const K = [
  0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a,
  0xa8304613, 0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
  0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821, 0xf61e2562, 0xc040b340,
  0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
  0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8,
  0x676f02d9, 0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
  0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70, 0x289b7ec6, 0xeaa127fa,
  0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
  0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92,
  0xffeff47d, 0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
  0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
];

function rotl(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0;
}

function toHexLE(n: number): string {
  let s = "";
  for (let i = 0; i < 4; i++) {
    const byte = (n >>> (i * 8)) & 0xff;
    s += byte.toString(16).padStart(2, "0");
  }
  return s;
}

/** Lowercase 32-char hex MD5 of a UTF-8 string. */
export function md5(input: string): string {
  const data = new TextEncoder().encode(input);
  const originalLenBits = data.length * 8;

  const withOne = data.length + 1;
  const padLen = ((56 - (withOne % 64)) % 64 + 64) % 64;
  const total = withOne + padLen + 8;
  const msg = new Uint8Array(total);
  msg.set(data, 0);
  msg[data.length] = 0x80;

  const lenLo = originalLenBits >>> 0;
  const lenHi = Math.floor(originalLenBits / 0x100000000) >>> 0;
  const o = total - 8;
  msg[o] = lenLo & 0xff;
  msg[o + 1] = (lenLo >>> 8) & 0xff;
  msg[o + 2] = (lenLo >>> 16) & 0xff;
  msg[o + 3] = (lenLo >>> 24) & 0xff;
  msg[o + 4] = lenHi & 0xff;
  msg[o + 5] = (lenHi >>> 8) & 0xff;
  msg[o + 6] = (lenHi >>> 16) & 0xff;
  msg[o + 7] = (lenHi >>> 24) & 0xff;

  let a0 = 0x67452301,
    b0 = 0xefcdab89,
    c0 = 0x98badcfe,
    d0 = 0x10325476;

  const M = new Array<number>(16);
  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      M[i] =
        (msg[j] | (msg[j + 1] << 8) | (msg[j + 2] << 16) | (msg[j + 3] << 24)) >>>
        0;
    }
    let A = a0,
      B = b0,
      C = c0,
      D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | (~D & 0xffffffff));
        g = (7 * i) % 16;
      }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + rotl(F, S[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
}

// ── Multi-algorithm hashing (cmd5-style hash page) ─────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
}
function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
async function shaBytes(
  algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
  input: Uint8Array,
): Promise<Uint8Array> {
  // copy into a fresh ArrayBuffer to satisfy BufferSource typing
  const buf = await crypto.subtle.digest(algo, input.slice());
  return new Uint8Array(buf);
}
async function shaHex(
  algo: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
  input: string,
): Promise<string> {
  return bytesToHex(await shaBytes(algo, new TextEncoder().encode(input)));
}

// MD4 (RFC 1320) — needed for NTLM. Same padding as MD5; 48 ops over 3 rounds.
function md4(bytes: Uint8Array): Uint8Array {
  const originalLenBits = bytes.length * 8;
  const withOne = bytes.length + 1;
  const padLen = (((56 - (withOne % 64)) % 64) + 64) % 64;
  const total = withOne + padLen + 8;
  const msg = new Uint8Array(total);
  msg.set(bytes, 0);
  msg[bytes.length] = 0x80;
  const lo = originalLenBits >>> 0;
  const hi = Math.floor(originalLenBits / 0x100000000) >>> 0;
  const o = total - 8;
  for (let i = 0; i < 4; i++) msg[o + i] = (lo >>> (i * 8)) & 0xff;
  for (let i = 0; i < 4; i++) msg[o + 4 + i] = (hi >>> (i * 8)) & 0xff;

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const X = new Array<number>(16);
  const FF = (a: number, b: number, c: number, d: number, x: number, s: number) =>
    rotl((a + ((b & c) | (~b & d)) + x) >>> 0, s);
  const GG = (a: number, b: number, c: number, d: number, x: number, s: number) =>
    rotl((a + ((b & c) | (b & d) | (c & d)) + x + 0x5a827999) >>> 0, s);
  const HH = (a: number, b: number, c: number, d: number, x: number, s: number) =>
    rotl((a + (b ^ c ^ d) + x + 0x6ed9eba1) >>> 0, s);

  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      X[i] = (msg[j] | (msg[j + 1] << 8) | (msg[j + 2] << 16) | (msg[j + 3] << 24)) >>> 0;
    }
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 16; i += 4) {
      a = FF(a, b, c, d, X[i], 3); d = FF(d, a, b, c, X[i + 1], 7);
      c = FF(c, d, a, b, X[i + 2], 11); b = FF(b, c, d, a, X[i + 3], 19);
    }
    for (const k of [0, 1, 2, 3]) {
      a = GG(a, b, c, d, X[k], 3); d = GG(d, a, b, c, X[k + 4], 5);
      c = GG(c, d, a, b, X[k + 8], 9); b = GG(b, c, d, a, X[k + 12], 13);
    }
    for (const k of [0, 2, 1, 3]) {
      a = HH(a, b, c, d, X[k], 3); d = HH(d, a, b, c, X[k + 8], 9);
      c = HH(c, d, a, b, X[k + 4], 11); b = HH(b, c, d, a, X[k + 12], 15);
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  const out = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((v, i) => {
    out[i * 4] = v & 0xff; out[i * 4 + 1] = (v >>> 8) & 0xff;
    out[i * 4 + 2] = (v >>> 16) & 0xff; out[i * 4 + 3] = (v >>> 24) & 0xff;
  });
  return out;
}

/** NTLM hash = MD4 of the password encoded as UTF-16LE (uppercase hex). */
export function ntlm(pass: string): string {
  const buf = new Uint8Array(pass.length * 2);
  for (let i = 0; i < pass.length; i++) {
    const code = pass.charCodeAt(i);
    buf[i * 2] = code & 0xff;
    buf[i * 2 + 1] = (code >>> 8) & 0xff;
  }
  return bytesToHex(md4(buf)).toUpperCase();
}

/** MySQL 4.1+ PASSWORD() = "*" + UPPER(sha1(sha1_raw(pass))). */
export async function mysql5(pass: string): Promise<string> {
  const once = await shaBytes("SHA-1", new TextEncoder().encode(pass));
  const twice = await shaBytes("SHA-1", once);
  return "*" + bytesToHex(twice).toUpperCase();
}

export interface HashEntry {
  label: string;
  value: string;
}

/** Full multi-algorithm output for the encrypt panel. salt is appended. */
export async function allHashes(text: string, salt = ""): Promise<HashEntry[]> {
  const s = text + salt;
  const md5hex = md5(s);
  const md5b = hexToBytes(md5hex);
  const [sha1, sha256, sha384, sha512, mysql] = await Promise.all([
    shaHex("SHA-1", s),
    shaHex("SHA-256", s),
    shaHex("SHA-384", s),
    shaHex("SHA-512", s),
    mysql5(s),
  ]);
  return [
    { label: "MD5 · 32 位（小写）", value: md5hex },
    { label: "MD5 · 32 位（大写）", value: md5hex.toUpperCase() },
    { label: "MD5 · 16 位（小写）", value: md5hex.slice(8, 24) },
    { label: "MD5 · 16 位（大写）", value: md5hex.slice(8, 24).toUpperCase() },
    { label: "双重 MD5 · md5(md5())", value: md5(md5hex) },
    { label: "MD5 · Base64", value: bytesToB64(md5b) },
    { label: "SHA-1", value: sha1 },
    { label: "SHA-256", value: sha256 },
    { label: "SHA-384", value: sha384 },
    { label: "SHA-512", value: sha512 },
    { label: "NTLM", value: ntlm(s) },
    { label: "MySQL5", value: mysql },
  ];
}

// ── Reverse lookup (honest best-effort, fully local) ───────────────────────

/** A compact built-in dictionary of weak/common passwords for reverse lookup. */
export const COMMON_PASSWORDS: string[] = [
  "123456", "password", "123456789", "12345678", "12345", "1234567", "111111",
  "1234567890", "123123", "000000", "qwerty", "abc123", "password1", "iloveyou",
  "1q2w3e4r", "admin", "qwerty123", "1234", "666666", "888888", "abcabc",
  "654321", "555555", "123321", "7777777", "888999", "112233", "121212",
  "qazwsx", "123qwe", "zxcvbnm", "asdfgh", "asdfghjkl", "1qaz2wsx", "qwertyuiop",
  "monkey", "dragon", "letmein", "login", "princess", "sunshine", "master",
  "welcome", "shadow", "ashley", "football", "jesus", "michael", "ninja",
  "mustang", "password123", "admin123", "root", "test", "test123", "guest",
  "a123456", "123456a", "5201314", "woaini", "woaini1314", "520520", "1314520",
  "147258369", "abc123456", "qwe123", "123456789a", "p@ssw0rd", "passw0rd",
  "hello", "hello123", "iloveyou1", "love", "freedom", "whatever", "trustno1",
  "superman", "batman", "starwars", "11111111", "00000000", "123abc", "aaaaaa",
  "zzzzzz", "asd123", "asdf1234", "1q2w3e", "qwer1234", "google", "facebook",
];

export interface ReverseHit {
  plain: string;
  source: "dictionary" | "brute";
}

/** Try the built-in dictionary (plus any user-supplied extras). */
export function reverseDictionary(
  targetHex: string,
  extras: string[] = [],
): ReverseHit | null {
  const target = targetHex.trim().toLowerCase();
  for (const w of [...extras, ...COMMON_PASSWORDS]) {
    if (md5(w) === target) return { plain: w, source: "dictionary" };
  }
  return null;
}

export const CHARSETS: Record<string, string> = {
  digits: "0123456789",
  lower: "abcdefghijklmnopqrstuvwxyz",
  loweralnum: "abcdefghijklmnopqrstuvwxyz0123456789",
  alnum: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
};

/** Total candidate count for a brute-force over `charset` up to `maxLen`. */
export function bruteSpace(charsetLen: number, maxLen: number): number {
  let total = 0;
  for (let len = 1; len <= maxLen; len++) total += Math.pow(charsetLen, len);
  return total;
}

/**
 * Bounded brute-force. Iterates all strings of length 1..maxLen over `charset`,
 * calling onProgress periodically. Returns the match or null. `shouldStop`
 * lets the caller cancel. Designed to be driven in chunks from a Web Worker /
 * async loop so the UI stays responsive.
 */
export function bruteForce(
  targetHex: string,
  charset: string,
  maxLen: number,
  opts: {
    onProgress?: (tried: number) => void;
    shouldStop?: () => boolean;
    chunk?: number;
  } = {},
): ReverseHit | null {
  const target = targetHex.trim().toLowerCase();
  const chars = [...charset];
  const n = chars.length;
  const chunk = opts.chunk ?? 50000;
  let tried = 0;

  for (let len = 1; len <= maxLen; len++) {
    const idx = new Array<number>(len).fill(0);
    while (true) {
      let candidate = "";
      for (let i = 0; i < len; i++) candidate += chars[idx[i]];
      tried++;
      if (md5(candidate) === target) return { plain: candidate, source: "brute" };

      if (tried % chunk === 0) {
        opts.onProgress?.(tried);
        if (opts.shouldStop?.()) return null;
      }

      // increment odometer
      let pos = len - 1;
      while (pos >= 0) {
        idx[pos]++;
        if (idx[pos] < n) break;
        idx[pos] = 0;
        pos--;
      }
      if (pos < 0) break; // exhausted this length
    }
  }
  return null;
}

/**
 * Async, UI-non-blocking brute-force. Same search as bruteForce() but yields to
 * the event loop every `chunk` candidates so React can re-render progress and
 * honour a Stop. Returns the match, or null if exhausted / stopped.
 */
export async function bruteForceAsync(
  targetHex: string,
  charset: string,
  maxLen: number,
  opts: {
    onProgress?: (tried: number) => void;
    shouldStop?: () => boolean;
    chunk?: number;
  } = {},
): Promise<ReverseHit | null> {
  const target = targetHex.trim().toLowerCase();
  const chars = [...charset];
  const n = chars.length;
  const chunk = opts.chunk ?? 20000;
  let tried = 0;

  for (let len = 1; len <= maxLen; len++) {
    const idx = new Array<number>(len).fill(0);
    while (true) {
      let candidate = "";
      for (let i = 0; i < len; i++) candidate += chars[idx[i]];
      tried++;
      if (md5(candidate) === target) return { plain: candidate, source: "brute" };

      if (tried % chunk === 0) {
        opts.onProgress?.(tried);
        if (opts.shouldStop?.()) return null;
        await new Promise((r) => setTimeout(r, 0));
      }

      let pos = len - 1;
      while (pos >= 0) {
        idx[pos]++;
        if (idx[pos] < n) break;
        idx[pos] = 0;
        pos--;
      }
      if (pos < 0) break;
    }
  }
  return null;
}
