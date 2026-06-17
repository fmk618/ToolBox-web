export const HASH_ALGORITHMS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export type HashAlgo = (typeof HASH_ALGORITHMS)[number];

export async function hashText(algo: HashAlgo, text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest(algo, buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
