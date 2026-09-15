export const RSA_KEY_SIZES = [2048, 3072, 4096] as const;
export type RsaKeySize = (typeof RSA_KEY_SIZES)[number];

export type RsaKeyPairPem = {
  publicKey: string;
  privateKey: string;
};

export async function generateRsaKeyPair(
  modulusLength: RsaKeySize,
): Promise<RsaKeyPairPem> {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    throw new Error(
      "当前页面不是安全上下文。请通过 HTTPS 或 localhost 打开页面后再生成 RSA 密钥；使用局域网 IP 的 HTTP 地址时，浏览器会禁用 Web Crypto。",
    );
  }
  if (!globalThis.crypto?.subtle) {
    throw new Error("当前浏览器不支持 Web Crypto，无法生成 RSA 密钥。");
  }

  const keyPair = await globalThis.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
  const [publicKey, privateKey] = await Promise.all([
    globalThis.crypto.subtle.exportKey("spki", keyPair.publicKey),
    globalThis.crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  return {
    publicKey: toPem(publicKey, "PUBLIC KEY"),
    privateKey: toPem(privateKey, "PRIVATE KEY"),
  };
}

export function toPem(source: ArrayBuffer, label: "PUBLIC KEY" | "PRIVATE KEY"): string {
  const bytes = new Uint8Array(source);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}
