import dynamic from "next/dynamic";
import type { Tool } from "./types";
import { TOOL_ENTRIES } from "./registry";

// 带 dynamic() 的完整 Tool 列表 — 仅在 Client Component 中导入。
// loader 与 meta 在 registry.ts 就地配对，这里不可能取到 undefined。
export const TOOLS: Tool[] = TOOL_ENTRIES.map(([m, ui]) => ({
  ...m,
  component: dynamic(ui, {
    loading: () => null,
    ssr: false,
  }),
}));

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
