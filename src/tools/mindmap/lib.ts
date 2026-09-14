import type { MindElixirData, NodeObj, TagObj, Theme } from "mind-elixir";

export type ThemePresetId = "latte" | "ocean" | "forest" | "dark" | "contrast" | "square";
export type DirectionId = "right" | "left" | "side" | "down";

export type OutlineNode = {
  node: NodeObj;
  depth: number;
  path: string;
};

export type ThemePreset = {
  id: ThemePresetId;
  label: string;
  description: string;
  theme: Theme;
};

const sharedCss = {
  "--node-gap-x": "24px",
  "--node-gap-y": "12px",
  "--main-gap-x": "42px",
  "--main-gap-y": "24px",
  "--topic-padding": "8px 12px",
  "--map-padding": "36px",
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "latte",
    label: "奶油浅色",
    description: "清爽的默认配色",
    theme: {
      name: "FMK Latte",
      type: "light",
      palette: ["#2563eb", "#0891b2", "#16a34a", "#d97706", "#db2777"],
      cssVar: {
        ...sharedCss,
        "--main-color": "#334155",
        "--main-bgcolor": "#eff6ff",
        "--main-bgcolor-transparent": "rgba(239,246,255,.82)",
        "--main-border": "#bfdbfe",
        "--color": "#1e293b",
        "--bgcolor": "#ffffff",
        "--selected": "#2563eb",
        "--accent-color": "#2563eb",
        "--root-color": "#ffffff",
        "--root-bgcolor": "#2563eb",
        "--root-border-color": "#1d4ed8",
        "--root-radius": "16px",
        "--main-radius": "12px",
        "--panel-color": "#334155",
        "--panel-bgcolor": "#ffffff",
        "--panel-border-color": "#e2e8f0",
      },
    },
  },
  {
    id: "ocean",
    label: "海洋蓝",
    description: "冷静、清晰的蓝绿色分支",
    theme: {
      name: "FMK Ocean",
      type: "light",
      palette: ["#0e7490", "#2563eb", "#4f46e5", "#0891b2", "#0f766e"],
      cssVar: {
        ...sharedCss,
        "--main-color": "#164e63",
        "--main-bgcolor": "#ecfeff",
        "--main-bgcolor-transparent": "rgba(236,254,255,.84)",
        "--main-border": "#a5f3fc",
        "--color": "#164e63",
        "--bgcolor": "#f8fafc",
        "--selected": "#0891b2",
        "--accent-color": "#0891b2",
        "--root-color": "#ecfeff",
        "--root-bgcolor": "#0e7490",
        "--root-border-color": "#155e75",
        "--root-radius": "16px",
        "--main-radius": "12px",
        "--panel-color": "#164e63",
        "--panel-bgcolor": "#f8fafc",
        "--panel-border-color": "#bae6fd",
      },
    },
  },
  {
    id: "forest",
    label: "森林绿",
    description: "适合知识整理和计划梳理",
    theme: {
      name: "FMK Forest",
      type: "light",
      palette: ["#15803d", "#0f766e", "#65a30d", "#ca8a04", "#16a34a"],
      cssVar: {
        ...sharedCss,
        "--main-color": "#14532d",
        "--main-bgcolor": "#f0fdf4",
        "--main-bgcolor-transparent": "rgba(240,253,244,.84)",
        "--main-border": "#bbf7d0",
        "--color": "#14532d",
        "--bgcolor": "#f7fee7",
        "--selected": "#16a34a",
        "--accent-color": "#16a34a",
        "--root-color": "#f0fdf4",
        "--root-bgcolor": "#15803d",
        "--root-border-color": "#166534",
        "--root-radius": "16px",
        "--main-radius": "12px",
        "--panel-color": "#14532d",
        "--panel-bgcolor": "#f7fee7",
        "--panel-border-color": "#bbf7d0",
      },
    },
  },
  {
    id: "dark",
    label: "深色夜间",
    description: "低亮度深色画布",
    theme: {
      name: "FMK Dark",
      type: "dark",
      palette: ["#60a5fa", "#22d3ee", "#4ade80", "#fbbf24", "#f472b6"],
      cssVar: {
        ...sharedCss,
        "--main-color": "#cbd5e1",
        "--main-bgcolor": "#1e293b",
        "--main-bgcolor-transparent": "rgba(30,41,59,.88)",
        "--main-border": "#475569",
        "--color": "#e2e8f0",
        "--bgcolor": "#0f172a",
        "--selected": "#60a5fa",
        "--accent-color": "#38bdf8",
        "--root-color": "#e0f2fe",
        "--root-bgcolor": "#0369a1",
        "--root-border-color": "#38bdf8",
        "--root-radius": "16px",
        "--main-radius": "12px",
        "--panel-color": "#cbd5e1",
        "--panel-bgcolor": "#0f172a",
        "--panel-border-color": "#334155",
      },
    },
  },
  {
    id: "contrast",
    label: "高对比度",
    description: "黑白文字和醒目分支",
    theme: {
      name: "FMK Contrast",
      type: "light",
      palette: ["#000000", "#b91c1c", "#1d4ed8", "#166534", "#7e22ce"],
      cssVar: {
        ...sharedCss,
        "--main-color": "#000000",
        "--main-bgcolor": "#ffffff",
        "--main-bgcolor-transparent": "rgba(255,255,255,.94)",
        "--main-border": "#000000",
        "--color": "#000000",
        "--bgcolor": "#ffffff",
        "--selected": "#000000",
        "--accent-color": "#000000",
        "--root-color": "#ffffff",
        "--root-bgcolor": "#000000",
        "--root-border-color": "#000000",
        "--root-radius": "10px",
        "--main-radius": "8px",
        "--panel-color": "#000000",
        "--panel-bgcolor": "#ffffff",
        "--panel-border-color": "#000000",
      },
    },
  },
  {
    id: "square",
    label: "方形卡片",
    description: "直角节点和清晰边界",
    theme: {
      name: "FMK Square",
      type: "light",
      palette: ["#1d4ed8", "#0f766e", "#b45309", "#be123c", "#6d28d9"],
      cssVar: {
        ...sharedCss,
        "--main-color": "#334155",
        "--main-bgcolor": "#f8fafc",
        "--main-bgcolor-transparent": "rgba(248,250,252,.9)",
        "--main-border": "#94a3b8",
        "--color": "#0f172a",
        "--bgcolor": "#ffffff",
        "--selected": "#1d4ed8",
        "--accent-color": "#1d4ed8",
        "--root-color": "#ffffff",
        "--root-bgcolor": "#1e3a8a",
        "--root-border-color": "#172554",
        "--root-radius": "0px",
        "--main-radius": "0px",
        "--panel-color": "#334155",
        "--panel-bgcolor": "#ffffff",
        "--panel-border-color": "#cbd5e1",
      },
    },
  },
];

export const DEFAULT_THEME_ID: ThemePresetId = "ocean";

export function getThemePreset(id: string | undefined): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ??
    THEME_PRESETS.find((preset) => preset.id === DEFAULT_THEME_ID)!;
}

export function flattenNodes(root: NodeObj): OutlineNode[] {
  const result: OutlineNode[] = [];
  const visit = (node: NodeObj, depth: number, path: string) => {
    result.push({ node, depth, path });
    node.children?.forEach((child, index) => visit(child, depth + 1, `${path}.${index + 1}`));
  };
  visit(root, 0, "1");
  return result;
}

export function filterOutline(nodes: OutlineNode[], query: string): OutlineNode[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return nodes;
  return nodes.filter(({ node }) => {
    const haystack = [
      node.topic,
      node.note ?? "",
      ...(node.tags ?? []).map((tag) => typeof tag === "string" ? tag : tag.text),
    ].join(" ").toLocaleLowerCase();
    return haystack.includes(normalized);
  });
}

function markdownTopic(topic: string): string {
  return topic.replace(/[\r\n]+/g, " ").trim();
}

export function toMarkdown(root: NodeObj): string {
  return flattenNodes(root)
    .map(({ node, depth }) => {
      const details = [
        node.note ? `\n${"  ".repeat(depth + 1)}> ${markdownTopic(node.note)}` : "",
        node.hyperLink ? ` (${node.hyperLink})` : "",
      ].join("");
      return `${"  ".repeat(depth)}- ${markdownTopic(node.topic)}${details}`;
    })
    .join("\n");
}

export function toPlainText(root: NodeObj): string {
  return flattenNodes(root)
    .map(({ node, depth }) => `${"  ".repeat(depth)}${markdownTopic(node.topic)}${node.note ? ` — ${markdownTopic(node.note)}` : ""}`)
    .join("\n");
}

const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%+-]+\)|hsla?\([\d\s,.%+-]+\)|transparent)$/i;
const SAFE_CSS_VALUE = /^[#\w\s().,%+\-/:]+$/;

export function isSafeColor(value: string): boolean {
  return SAFE_COLOR.test(value.trim());
}

export function isSafeHyperlink(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}

function isSafeStyleValue(value: unknown): value is string {
  return typeof value === "string" && value.length <= 120 && SAFE_CSS_VALUE.test(value) && !/url|expression|javascript/i.test(value);
}

function isSafeTag(tag: unknown): tag is string | TagObj {
  if (typeof tag === "string") return tag.length <= 40 && !/[<>]/.test(tag);
  if (!tag || typeof tag !== "object") return false;
  const item = tag as TagObj;
  return Object.keys(item).every((key) => key === "text") && typeof item.text === "string" && item.text.length <= 40 && !/[<>]/.test(item.text);
}

function isSafeNode(node: unknown, seen: Set<unknown>): node is NodeObj {
  if (!node || typeof node !== "object" || seen.has(node)) return false;
  seen.add(node);
  const value = node as Partial<NodeObj> & { dangerouslySetInnerHTML?: unknown };
  if (typeof value.id !== "string" || value.id.length > 200 || typeof value.topic !== "string" || value.topic.length > 1000) return false;
  if (Object.prototype.hasOwnProperty.call(value, "dangerouslySetInnerHTML")) return false;
  if (Object.prototype.hasOwnProperty.call(value, "parent")) return false;
  if (value.image !== undefined) return false;
  if (value.note !== undefined && (typeof value.note !== "string" || value.note.length > 5000)) return false;
  if (!isSafeHyperlink(value.hyperLink ?? "")) return false;
  if (value.icons !== undefined && (!Array.isArray(value.icons) || value.icons.some((icon) => typeof icon !== "string" || icon.length > 16 || /[<>]/.test(icon)))) return false;
  if (value.tags !== undefined && (!Array.isArray(value.tags) || value.tags.some((tag) => !isSafeTag(tag)))) return false;
  if (value.branchColor !== undefined && !isSafeColor(value.branchColor)) return false;
  if (value.style) {
    for (const [key, styleValue] of Object.entries(value.style)) {
      if (!["fontSize", "fontFamily", "color", "background", "fontWeight", "width", "border", "textDecoration"].includes(key)) return false;
      if (!isSafeStyleValue(styleValue)) return false;
      if (["color", "background"].includes(key) && !isSafeColor(styleValue)) return false;
    }
  }
  return !value.children || (Array.isArray(value.children) && value.children.every((child) => isSafeNode(child, seen)));
}

function isSafeTheme(theme: unknown): theme is Theme {
  if (!theme || typeof theme !== "object") return false;
  const value = theme as Theme;
  if (typeof value.name !== "string" || value.name.length > 100 || !Array.isArray(value.palette) || value.palette.length > 20) return false;
  if (value.palette.some((color) => typeof color !== "string" || !isSafeColor(color))) return false;
  return !value.cssVar || Object.values(value.cssVar).every((item) => isSafeStyleValue(item));
}

function isSafeRelationshipStyleValue(value: unknown): boolean {
  return (typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= 1000) || isSafeStyleValue(value);
}

function isSafeRelationshipData(data: MindElixirData): boolean {
  const nodeIds = new Set(flattenNodes(data.nodeData).map(({ node }) => node.id));
  if (data.arrows) {
    if (!Array.isArray(data.arrows)) return false;
    for (const arrow of data.arrows) {
      if (!arrow || typeof arrow.id !== "string" || typeof arrow.label !== "string" || arrow.label.length > 500) return false;
      if (!nodeIds.has(arrow.from) || !nodeIds.has(arrow.to)) return false;
      if (arrow.style && Object.values(arrow.style).some((value) => !isSafeRelationshipStyleValue(value))) return false;
    }
  }
  if (data.summaries) {
    if (!Array.isArray(data.summaries)) return false;
    for (const summary of data.summaries) {
      if (!summary || typeof summary.id !== "string" || typeof summary.label !== "string" || summary.label.length > 500) return false;
      if (!nodeIds.has(summary.parent) || !Number.isInteger(summary.start) || !Number.isInteger(summary.end)) return false;
      if (summary.style && Object.values(summary.style).some((value) => !isSafeStyleValue(value))) return false;
    }
  }
  return true;
}

export function isSafeMindMapData(value: unknown): value is MindElixirData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<MindElixirData>;
  if (!isSafeNode(data.nodeData, new Set())) return false;
  if (data.direction !== undefined && ![0, 1, 2, 3].includes(data.direction)) return false;
  if (data.compact !== undefined && typeof data.compact !== "boolean") return false;
  if (data.theme !== undefined && !isSafeTheme(data.theme)) return false;
  return isSafeRelationshipData(data as MindElixirData);
}

export function mergeNodeStyle(node: NodeObj, style: Partial<NonNullable<NodeObj["style"]>>): NodeObj {
  return { ...node, style: { ...node.style, ...style } };
}

export function colorInputValue(value: string | undefined, fallback: string): string {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

export function parseTags(value: string): string[] {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20).filter((tag) => tag.length <= 40 && !/[<>]/.test(tag));
}

export function parseIcons(value: string): string[] {
  return Array.from(new Set(value.split(/[,\s]+/).map((icon) => icon.trim()).filter(Boolean))).slice(0, 8).filter((icon) => icon.length <= 16 && !/[<>]/.test(icon));
}
