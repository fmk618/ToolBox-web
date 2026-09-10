export type JsonLineResult = {
  line: number;
  source: string;
  value?: unknown;
  error?: string;
};

export const MAX_JSON_LINES = 10_000;
export const MAX_JSON_LINES_INPUT = 5 * 1024 * 1024;

export function inspectJsonLines(input: string): JsonLineResult[] {
  if (input.length > MAX_JSON_LINES_INPUT) {
    throw new Error("输入不能超过 5 MB");
  }

  const results: JsonLineResult[] = [];
  const lines = input.replace(/^﻿/u, "").split(/\r?\n/u);
  if (lines.length > MAX_JSON_LINES) {
    throw new Error(`最多支持 ${MAX_JSON_LINES.toLocaleString("zh-CN")} 行`);
  }

  lines.forEach((source, index) => {
    if (!source.trim()) return;
    try {
      results.push({ line: index + 1, source, value: JSON.parse(source) as unknown });
    } catch (error) {
      results.push({
        line: index + 1,
        source,
        error: error instanceof Error ? error.message : "JSON 格式无效",
      });
    }
  });
  return results;
}
