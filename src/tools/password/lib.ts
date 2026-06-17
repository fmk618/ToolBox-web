export type CharSet = "lower" | "upper" | "digit" | "symbol";

const SETS: Record<CharSet, string> = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digit: "0123456789",
  symbol: "!@#$%^&*()-_=+[]{};:,.<>/?~",
};

export function generatePassword(opts: {
  length: number;
  sets: Set<CharSet>;
  excludeAmbiguous: boolean;
}): string {
  let alphabet = [...opts.sets].map((s) => SETS[s]).join("");
  if (opts.excludeAmbiguous) {
    alphabet = alphabet.replace(/[O0Il1|`'"]/g, "");
  }
  if (!alphabet) return "";

  const out = new Uint32Array(opts.length);
  crypto.getRandomValues(out);
  const max = alphabet.length;
  let pwd = "";
  for (let i = 0; i < opts.length; i++) {
    pwd += alphabet[out[i] % max];
  }
  return pwd;
}

/** Rough entropy estimate: bits = length * log2(alphabet). */
export function estimateBits(length: number, sets: Set<CharSet>, exclude: boolean): number {
  let alphabet = [...sets].map((s) => SETS[s]).join("");
  if (exclude) alphabet = alphabet.replace(/[O0Il1|`'"]/g, "");
  if (!alphabet) return 0;
  return Math.round(length * Math.log2(alphabet.length));
}

export function strengthLabel(bits: number): { label: string; color: string } {
  if (bits < 28) return { label: "极弱", color: "bg-red-500" };
  if (bits < 50) return { label: "弱", color: "bg-orange-500" };
  if (bits < 80) return { label: "中", color: "bg-yellow-500" };
  if (bits < 120) return { label: "强", color: "bg-green-500" };
  return { label: "极强", color: "bg-emerald-600" };
}
