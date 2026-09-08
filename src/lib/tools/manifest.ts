import type { CategoryId, ToolMeta } from "./types";
import { TOOL_ENTRIES } from "./registry";

// 纯静态元数据，不含 dynamic() — 可被 Server Component 安全导入
export const TOOLS: ToolMeta[] = TOOL_ENTRIES.map(([m]) => m);

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** 按分类分组，保持注册顺序。首页 / 侧栏 / 命令面板共用这一份实现。 */
export function toolsByCategory(): [CategoryId, ToolMeta[]][] {
  const map = new Map<CategoryId, ToolMeta[]>();
  for (const t of TOOLS) {
    const list = map.get(t.category);
    if (list) list.push(t);
    else map.set(t.category, [t]);
  }
  return Array.from(map.entries());
}
