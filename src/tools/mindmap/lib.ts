import type { MindElixirData, NodeObj, TagObj, Theme } from "mind-elixir";

export type ThemePresetId = "latte" | "ocean" | "forest" | "dark" | "contrast" | "square";
export type DirectionId = "right" | "left" | "side" | "down";

/** A position accepted by a free-canvas graph implementation. */
export type CanvasPosition = {
  x: number;
  y: number;
};

export type MindMapPositions = Record<string, CanvasPosition>;
export type MindMapLayoutId = "mindmap" | "tree" | "free";

/**
 * Viewport metadata is deliberately small and numeric so it can be persisted
 * in a MindElixir snapshot without becoming a CSS or HTML escape hatch.
 */
export type MindMapCanvasMeta = {
  x?: number;
  y?: number;
  zoom?: number;
  width?: number;
  height?: number;
  panX?: number;
  panY?: number;
  background?: string;
  grid?: "dots" | "lines" | "none";
  gridColor?: string;
};

export type MindMapMeta = {
  mindmapTheme?: string;
  layout?: MindMapLayoutId;
  positions?: MindMapPositions;
  canvas?: MindMapCanvasMeta;
  viewport?: MindMapCanvasMeta;
  [key: string]: unknown;
};

/**
 * These types intentionally mirror the small part of a React Flow node/edge
 * used by the converter. Keeping them local means the data layer stays usable
 * by other canvas implementations and does not pull React into lib.ts.
 */
export type MindMapGraphNodeData = {
  label: string;
  node: NodeObj;
};

export type MindMapGraphNode = {
  id: string;
  type?: string;
  position: CanvasPosition;
  data: MindMapGraphNodeData;
};

export type MindMapGraphEdgeData = {
  kind?: "hierarchy" | "relationship";
  label?: string;
  bidirectional?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: string | number;
    strokeDasharray?: string;
    opacity?: string | number;
    labelColor?: string;
  };
};

export type MindMapGraphEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  data?: MindMapGraphEdgeData;
};

export type MindMapGraph = {
  nodes: MindMapGraphNode[];
  edges: MindMapGraphEdge[];
};

const MAX_CANVAS_COORDINATE = 10_000_000;
const MAX_CANVAS_ZOOM = 10;
const MIN_CANVAS_ZOOM = 0.05;
const MAX_META_KEYS = 64;
const MAX_POSITION_ENTRIES = 10_000;
const INITIAL_LAYOUT_X_GAP = 280;
const INITIAL_LAYOUT_Y_GAP = 120;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeCanvasCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= MAX_CANVAS_COORDINATE;
}

function isSafeCanvasPosition(value: unknown): value is CanvasPosition {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== "x" && key !== "y")) return false;
  return isSafeCanvasCoordinate(value.x) && isSafeCanvasCoordinate(value.y);
}

/** Return only well-formed positions; malformed metadata is ignored by layout. */
function storedPositions(data: MindElixirData): Record<string, CanvasPosition> {
  const meta = data.meta;
  if (!isRecord(meta) || !isRecord(meta.positions)) return {};
  const positions: Record<string, CanvasPosition> = {};
  for (const [id, value] of Object.entries(meta.positions)) {
    if (id.length <= 200 && isSafeCanvasPosition(value)) {
      positions[id] = { x: value.x, y: value.y };
    }
  }
  return positions;
}

/**
 * Produce a deterministic tree layout for snapshots created before free-canvas
 * positions existed. Nodes at the same depth have a fixed vertical separation;
 * parent nodes are placed at the midpoint of their children. The output is
 * centered around y=0 and therefore remains stable across renders.
 */
export function createInitialMindMapPositions(root: NodeObj): MindMapPositions {
  const positions: MindMapPositions = {};
  const visiting = new Set<NodeObj>();
  const ids = new Set<string>();
  let leafIndex = 0;

  const visit = (node: NodeObj, depth: number): number => {
    if (visiting.has(node)) throw new Error("无法为循环思维导图生成布局。");
    if (ids.has(node.id)) throw new Error(`思维导图包含重复节点 ID：${node.id}`);
    visiting.add(node);
    ids.add(node.id);
    const children = node.children ?? [];
    let y: number;
    if (children.length === 0) {
      y = leafIndex * INITIAL_LAYOUT_Y_GAP;
      leafIndex += 1;
    } else {
      const childY = children.map((child) => visit(child, depth + 1));
      y = childY.reduce((sum, item) => sum + item, 0) / childY.length;
    }
    positions[node.id] = { x: depth * INITIAL_LAYOUT_X_GAP, y };
    visiting.delete(node);
    return y;
  };

  visit(root, 0);
  const yOffset = ((leafIndex - 1) * INITIAL_LAYOUT_Y_GAP) / 2;
  for (const position of Object.values(positions)) position.y -= yOffset;
  return positions;
}

/** Alias with a shorter name for canvas integrations. */
export const createInitialGraphPositions = createInitialMindMapPositions;

export function createAutoLayoutPositions(
  root: NodeObj,
  direction: DirectionId,
  compact = false,
): MindMapPositions {
  const gapX = compact ? 220 : 300;
  const gapY = compact ? 88 : 132;
  const positions: MindMapPositions = {};
  const leafIndex = { value: 0 };

  const visit = (node: NodeObj, depth: number, side = 1): number => {
    const children = node.children ?? [];
    if (children.length === 0) {
      const y = leafIndex.value * gapY;
      leafIndex.value += 1;
      positions[node.id] = { x: depth * gapX * side, y };
      return y;
    }
    const childYs = children.map((child, index) => {
      const childSide = direction === "side" && depth === 0 ? (index % 2 === 0 ? -1 : 1) : side;
      return visit(child, depth + 1, childSide);
    });
    const y = (childYs[0] + childYs[childYs.length - 1]) / 2;
    positions[node.id] = { x: depth * gapX * side, y };
    return y;
  };

  visit(root, 0, direction === "left" ? -1 : 1);
  const offset = leafIndex.value > 0 ? ((leafIndex.value - 1) * gapY) / 2 : 0;
  for (const position of Object.values(positions)) position.y -= offset;
  if (direction === "down") {
    for (const position of Object.values(positions)) {
      const x = position.x;
      position.x = position.y;
      position.y = x;
    }
  }
  return positions;
}

export const createLayoutPositions = createAutoLayoutPositions;

function positionsForData(data: MindElixirData): MindMapPositions {
  const generated = createInitialMindMapPositions(data.nodeData);
  const stored = storedPositions(data);
  const positions: MindMapPositions = {};
  const occupied = new Set<string>();
  for (const { node } of flattenNodes(data.nodeData)) {
    const candidate = stored[node.id] ?? generated[node.id];
    if (!candidate) continue;
    let position = { x: candidate.x, y: candidate.y };
    // Preserve valid saved positions. If old/partial metadata repeats a point,
    // move only the later node by one layout column so the initial canvas is
    // still usable and deterministic.
    while (occupied.has(`${position.x}:${position.y}`)) {
      position = { x: position.x + INITIAL_LAYOUT_X_GAP, y: position.y };
    }
    occupied.add(`${position.x}:${position.y}`);
    positions[node.id] = position;
  }
  return positions;
}

/** Convert a MindElixir tree to nodes and parent-child edges for a free canvas. */
export function mindElixirDataToGraph(data: MindElixirData): MindMapGraph {
  const positions = positionsForData(data);
  const nodes: MindMapGraphNode[] = [];
  const edges: MindMapGraphEdge[] = [];
  const ids = new Set<string>();

  const visit = (node: NodeObj, parentId?: string): void => {
    if (ids.has(node.id)) throw new Error(`思维导图包含重复节点 ID：${node.id}`);
    ids.add(node.id);
    nodes.push({
      id: node.id,
      type: "mindmap",
      position: positions[node.id] ?? { x: 0, y: 0 },
      data: { label: node.topic, node },
    });
    if (parentId) {
      edges.push({ id: `${parentId}->${node.id}`, source: parentId, target: node.id, data: { kind: "hierarchy" } });
    }
    node.children?.forEach((child) => visit(child, node.id));
  };
  visit(data.nodeData);
  for (const arrow of data.arrows ?? []) {
    if (ids.has(arrow.from) && ids.has(arrow.to)) {
      edges.push({
        id: arrow.id,
        source: arrow.from,
        target: arrow.to,
        data: {
          kind: "relationship",
          label: arrow.label,
          bidirectional: arrow.bidirectional,
          style: arrow.style,
        },
      });
    }
  }
  return { nodes, edges };
}

/** A concise alias used by adapters that do not mention MindElixir by name. */
export const mindElixirToGraph = mindElixirDataToGraph;

/** Extract finite graph coordinates in node order for persistence in meta.positions. */
export function positionsFromGraphNodes(nodes: readonly MindMapGraphNode[]): MindMapPositions {
  const positions: MindMapPositions = {};
  for (const node of nodes) {
    if (typeof node.id !== "string" || node.id.length > 200) continue;
    if (isSafeCanvasPosition(node.position)) {
      positions[node.id] = { x: node.position.x, y: node.position.y };
    }
  }
  return positions;
}

/** Return a snapshot with current free-canvas coordinates persisted in meta. */
export function updateMindElixirDataPositions(
  data: MindElixirData,
  nodes: readonly MindMapGraphNode[],
): MindElixirData {
  const positions = positionsFromGraphNodes(nodes);
  return {
    ...data,
    meta: {
      ...(isRecord(data.meta) ? data.meta : {}),
      positions,
    },
  };
}

export const withGraphPositions = updateMindElixirDataPositions;

function findNodeById(root: NodeObj, id: string): NodeObj | undefined {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return undefined;
}

function graphNodeSource(node: MindMapGraphNode, baseData: MindElixirData | undefined): NodeObj {
  const candidate = node.data?.node;
  if (candidate && typeof candidate === "object") return candidate;
  const fromBase = baseData && findNodeById(baseData.nodeData, node.id);
  if (fromBase) return fromBase;
  const label = node.data?.label;
  if (typeof label !== "string") throw new Error(`画布节点缺少主题：${node.id}`);
  return { id: node.id, topic: label };
}

function copyGraphNode(source: NodeObj, id: string, fallbackTopic: string): NodeObj {
  const rest = { ...source };
  delete rest.children;
  delete rest.parent;
  delete rest.dangerouslySetInnerHTML;
  return {
    ...rest,
    id,
    topic: typeof rest.topic === "string" ? rest.topic : fallbackTopic,
  };
}

function validateGraphNode(node: MindMapGraphNode): void {
  if (!node || typeof node.id !== "string" || node.id.length === 0 || node.id.length > 200) {
    throw new Error("画布节点 ID 无效。");
  }
  if (!isSafeCanvasPosition(node.position)) throw new Error(`画布节点位置无效：${node.id}`);
}

/**
 * Rebuild a MindElixir tree from graph nodes and hierarchy edges. Existing
 * snapshot fields (theme, direction, arrows, summaries and other metadata) are
 * retained, while meta.positions is replaced with the current graph positions.
 */
export function graphNodesToMindElixirData(
  nodes: readonly MindMapGraphNode[],
  edges: readonly MindMapGraphEdge[],
  baseData?: MindElixirData,
): MindElixirData {
  if (nodes.length === 0) throw new Error("画布至少需要一个节点。");
  const nodeById = new Map<string, MindMapGraphNode>();
  for (const node of nodes) {
    validateGraphNode(node);
    if (nodeById.has(node.id)) throw new Error(`画布包含重复节点 ID：${node.id}`);
    nodeById.set(node.id, node);
  }

  const childrenById = new Map<string, string[]>();
  const parentById = new Map<string, string>();
  const hierarchyEdges = edges.filter((edge) => edge.data?.kind !== "relationship");
  const relationshipEdges = edges.filter((edge) => edge.data?.kind === "relationship");
  for (const edge of hierarchyEdges) {
    if (!edge || typeof edge.id !== "string" || edge.id.length > 400) throw new Error("画布边无效。");
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target) || edge.source === edge.target) {
      throw new Error(`画布边引用了不存在或相同的节点：${edge.id}`);
    }
    if (parentById.has(edge.target)) throw new Error(`节点存在多个父节点：${edge.target}`);
    parentById.set(edge.target, edge.source);
    const children = childrenById.get(edge.source) ?? [];
    children.push(edge.target);
    childrenById.set(edge.source, children);
  }
  for (const edge of relationshipEdges) {
    if (!edge || typeof edge.id !== "string" || edge.id.length > 400) throw new Error("画布关系线无效。");
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target) || edge.source === edge.target) {
      throw new Error(`画布关系线引用了不存在或相同的节点：${edge.id}`);
    }
  }

  const roots = nodes.filter((node) => !parentById.has(node.id));
  if (roots.length !== 1) throw new Error("画布必须恰好包含一个根节点。");
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const build = (id: string): NodeObj => {
    if (visiting.has(id)) throw new Error("画布层级边包含循环。");
    if (visited.has(id)) throw new Error(`画布节点被重复连接：${id}`);
    const graphNode = nodeById.get(id)!;
    visiting.add(id);
    const source = graphNodeSource(graphNode, baseData);
    const result = copyGraphNode(source, id, graphNode.data?.label ?? id);
    const childIds = childrenById.get(id) ?? [];
    if (childIds.length > 0) result.children = childIds.map((childId) => build(childId));
    visiting.delete(id);
    visited.add(id);
    return result;
  };

  const nodeData = build(roots[0].id);
  if (visited.size !== nodes.length) throw new Error("画布包含无法从根节点到达的节点。");
  const nextMeta: MindMapMeta = {
    ...(isRecord(baseData?.meta) ? baseData.meta : {}),
    positions: positionsFromGraphNodes(nodes),
  };
  const arrows = relationshipEdges.map((edge) => ({
    id: edge.id,
    label: edge.data?.label ?? "",
    from: edge.source,
    to: edge.target,
    bidirectional: edge.data?.bidirectional,
    style: edge.data?.style,
  }));
  return {
    ...(baseData ?? {}),
    nodeData,
    arrows,
    meta: nextMeta,
  };
}

export function graphToMindElixirData(
  graph: MindMapGraph,
  baseData?: MindElixirData,
): MindElixirData {
  return graphNodesToMindElixirData(graph.nodes, graph.edges, baseData);
}

export const graphToMindMapData = graphToMindElixirData;

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

/** Validate the bounded viewport fields persisted for a free canvas. */
export function isSafeCanvasMeta(value: unknown): value is MindMapCanvasMeta {
  if (!isRecord(value) || Object.keys(value).length > 8) return false;
  const allowed = new Set(["x", "y", "zoom", "width", "height", "panX", "panY"]);
  for (const [key, item] of Object.entries(value)) {
    if (!allowed.has(key) || typeof item !== "number" || !Number.isFinite(item)) return false;
    if (["width", "height"].includes(key)) {
      if (item < 0 || item > MAX_CANVAS_COORDINATE) return false;
    } else if (key === "zoom") {
      if (item < MIN_CANVAS_ZOOM || item > MAX_CANVAS_ZOOM) return false;
    } else if (Math.abs(item) > MAX_CANVAS_COORDINATE) {
      return false;
    }
  }
  return true;
}

/** Validate the position map and reject prototype-pollution keys. */
export function isSafeMindMapPositions(value: unknown): value is MindMapPositions {
  if (!isRecord(value) || Object.keys(value).length > MAX_POSITION_ENTRIES) return false;
  for (const [id, position] of Object.entries(value)) {
    if (!id || id.length > 200 || ["__proto__", "constructor", "prototype"].includes(id)) return false;
    if (!isSafeCanvasPosition(position)) return false;
  }
  return true;
}

function isSafeMetaValue(value: unknown, depth: number): boolean {
  if (value === null || value === undefined || typeof value === "boolean") return true;
  if (typeof value === "string") return value.length <= 5000 && !/[<>]/.test(value);
  if (typeof value === "number") return Number.isFinite(value) && Math.abs(value) <= MAX_CANVAS_COORDINATE;
  if (depth >= 4 || !isRecord(value)) {
    if (Array.isArray(value)) return value.length <= 100 && depth < 4 && value.every((item) => isSafeMetaValue(item, depth + 1));
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length > 64 || keys.some((key) => ["__proto__", "constructor", "prototype"].includes(key))) return false;
  return keys.every((key) => isSafeMetaValue(value[key], depth + 1));
}

/**
 * Validate extension metadata while retaining support for harmless custom
 * fields. Layout, canvas, viewport and positions have stricter schemas because
 * those values are consumed directly by canvas code.
 */
export function isSafeMindMapMeta(value: unknown): value is MindMapMeta {
  if (!isRecord(value) || Object.keys(value).length > MAX_META_KEYS) return false;
  for (const [key, item] of Object.entries(value)) {
    if (["__proto__", "constructor", "prototype"].includes(key)) return false;
    if (key === "mindmapTheme") {
      if (typeof item !== "string" || item.length > 100 || /[<>]/.test(item)) return false;
    } else if (key === "layout") {
      if (item !== "mindmap" && item !== "tree" && item !== "free") return false;
    } else if (key === "positions") {
      if (!isSafeMindMapPositions(item)) return false;
    } else if (key === "canvas" || key === "viewport") {
      if (!isSafeCanvasMeta(item)) return false;
    } else if (!isSafeMetaValue(item, 0)) {
      return false;
    }
  }
  return true;
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
  if (data.meta !== undefined && !isSafeMindMapMeta(data.meta)) return false;
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
