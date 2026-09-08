/** Uniform random integer using crypto when available (with modulo-bias rejection). */
export function secureIndex(length: number): number {
  if (length <= 0) return -1;
  if (typeof crypto === "undefined" || !crypto.getRandomValues) return Math.floor(Math.random() * length);
  const limit = Math.floor(0x1_0000_0000 / length) * length;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= limit);
  return buf[0] % length;
}

export function entriesFromText(value: string): string[] {
  return value.replace(/\r\n?/g, "\n").split("\n").map((s) => s.trim()).filter(Boolean);
}
