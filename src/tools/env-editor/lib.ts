export const MAX_ENV_INPUT = 1 * 1024 * 1024;

export type EnvLine =
  | { kind: "blank" | "comment"; line: number; text: string }
  | { kind: "entry"; line: number; key: string; value: string }
  | { kind: "error"; line: number; text: string; error: string };

export function parseEnv(input: string): EnvLine[] {
  if (input.length > MAX_ENV_INPUT) throw new Error(".env 内容不能超过 1 MB");
  return input.split(/\r?\n/u).map((text, index) => {
    const line = index + 1;
    const trimmed = text.trim();
    if (!trimmed) return { kind: "blank", line, text } as const;
    if (trimmed.startsWith("#")) return { kind: "comment", line, text } as const;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u);
    if (!match) return { kind: "error", line, text, error: "需要 KEY=value 格式" } as const;
    const rawValue = match[2];
    if ((rawValue.startsWith('"') && !rawValue.endsWith('"')) || (rawValue.startsWith("'") && !rawValue.endsWith("'"))) {
      return { kind: "error", line, text, error: "引号未闭合" } as const;
    }
    const value = ((rawValue.startsWith('"') && rawValue.endsWith('"')) || (rawValue.startsWith("'") && rawValue.endsWith("'")))
      ? rawValue.slice(1, -1)
      : rawValue;
    return { kind: "entry", line, key: match[1], value } as const;
  });
}

export function duplicateEnvKeys(lines: readonly EnvLine[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const line of lines) {
    if (line.kind !== "entry") continue;
    if (seen.has(line.key)) duplicates.add(line.key);
    seen.add(line.key);
  }
  return [...duplicates];
}
