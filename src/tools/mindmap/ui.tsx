"use client";

import type { ChangeEvent, MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnMoveEnd,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import {
  Bold,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  FileDown,
  FileOutput,
  FileText,
  FileUp,
  GitBranch,
  Hand,
  Layout,
  Link2,
  LocateFixed,
  Maximize2,
  MousePointer2,
  PanelLeft,
  PanelRight,
  Palette,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Underline,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { MindElixirData, NodeObj } from "mind-elixir";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Select } from "../../components/tools/select";
import { ToolShell } from "../../components/tools/tool-shell";
import { downloadDataUrl, downloadText } from "../../lib/download";
import { newId } from "../../lib/id";
import { generateMindmap, type MindmapOperation, type MindmapTemplate } from "../../lib/api";
import { loadLLMConfig } from "../../lib/llm-config";
import { meta } from "./meta";
import {
  colorInputValue,
  createAutoLayoutPositions,
  DEFAULT_THEME_ID,
  filterOutline,
  flattenNodes,
  getThemePreset,
  graphToMindElixirData,
  isSafeHyperlink,
  isSafeMindMapData,
  mindElixirDataToGraph,
  mergeNodeStyle,
  parseIcons,
  parseTags,
  positionsFromGraphNodes,
  updateMindElixirDataPositions,
  toMarkdown,
  toPlainText,
  type DirectionId,
  type MindMapGraph,
  type MindMapGraphNode,
  type ThemePresetId,
} from "./lib";
import {
  MindMapCanvas,
  graphToCanvas,
  type MindMapCanvasEdge,
  type MindMapCanvasNode,
} from "./canvas";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;
const MAX_HISTORY = 60;

type PanelId = "outline" | "inspector" | "ai" | null;

type DirectionOption = { value: DirectionId; label: string };

const directionOptions: DirectionOption[] = [
  { value: "right", label: "右向" },
  { value: "left", label: "左向" },
  { value: "side", label: "双侧" },
  { value: "down", label: "上下" },
];

const themeOptions = [
  { value: "latte", label: "奶油浅色" },
  { value: "ocean", label: "海洋蓝" },
  { value: "forest", label: "森林绿" },
  { value: "dark", label: "深色夜间" },
  { value: "contrast", label: "高对比度" },
  { value: "square", label: "方形卡片" },
];

const iconOptions = ["⭐", "✅", "💡", "🔥", "📌", "🚀", "⚠️", "❓"];
const aiTemplateOptions: { value: MindmapTemplate; label: string; description: string }[] = [
  { value: "project-plan", label: "项目计划", description: "目标、阶段、任务和风险" },
  { value: "meeting-notes", label: "会议纪要", description: "议题、结论、行动项和负责人" },
  { value: "study-notes", label: "学习笔记", description: "概念、重点、例子和复习路径" },
  { value: "swot", label: "SWOT 分析", description: "优势、劣势、机会和威胁" },
  { value: "product-roadmap", label: "产品路线图", description: "愿景、版本、里程碑和交付" },
  { value: "org-chart", label: "组织结构", description: "部门、角色、职责和汇报关系" },
  { value: "research-report", label: "研究报告", description: "问题、方法、证据、结论和局限" },
  { value: "course-outline", label: "课程大纲", description: "章节、知识点、练习和作业" },
];
const aiOperationOptions = [
  { value: "replace" as MindmapOperation, label: "生成新导图" },
  { value: "append" as MindmapOperation, label: "追加到选中节点" },
  { value: "refine" as MindmapOperation, label: "整理当前导图" },
];

function createEmptyDocument(): MindElixirData {
  const theme = getThemePreset(DEFAULT_THEME_ID).theme;
  return {
    nodeData: { id: "mindmap-root", topic: "中心主题" },
    direction: 1,
    theme,
    compact: false,
    meta: { mindmapTheme: DEFAULT_THEME_ID, layout: "free", positions: {} },
  };
}

function cloneNode(node: NodeObj): NodeObj {
  const rest = { ...node };
  delete rest.parent;
  delete rest.dangerouslySetInnerHTML;
  return { ...rest, children: node.children?.map(cloneNode) };
}

function mapTreeNode(root: NodeObj, id: string, transform: (node: NodeObj) => NodeObj): NodeObj {
  if (root.id === id) return transform(cloneNode(root));
  return {
    ...cloneNode(root),
    children: root.children?.map((child) => mapTreeNode(child, id, transform)),
  };
}

function insertAfter(root: NodeObj, targetId: string, nextNode: NodeObj): { root: NodeObj; inserted: boolean } {
  const copy = cloneNode(root);
  const children = copy.children ?? [];
  const index = children.findIndex((child) => child.id === targetId);
  if (index >= 0) {
    children.splice(index + 1, 0, nextNode);
    copy.children = children;
    return { root: copy, inserted: true };
  }
  for (let index = 0; index < children.length; index += 1) {
    const result = insertAfter(children[index], targetId, nextNode);
    if (result.inserted) {
      children[index] = result.root;
      copy.children = children;
      return { root: copy, inserted: true };
    }
  }
  return { root: copy, inserted: false };
}

function removeFromTree(root: NodeObj, targetId: string): { root: NodeObj; removed: boolean } {
  const copy = cloneNode(root);
  const children = copy.children ?? [];
  const index = children.findIndex((child) => child.id === targetId);
  if (index >= 0) {
    children.splice(index, 1);
    copy.children = children.length ? children : undefined;
    return { root: copy, removed: true };
  }
  for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
    const result = removeFromTree(children[childIndex], targetId);
    if (result.removed) {
      children[childIndex] = result.root;
      copy.children = children;
      return { root: copy, removed: true };
    }
  }
  return { root: copy, removed: false };
}

function moveSibling(root: NodeObj, targetId: string, delta: -1 | 1): { root: NodeObj; moved: boolean } {
  const copy = cloneNode(root);
  const children = copy.children ?? [];
  const index = children.findIndex((child) => child.id === targetId);
  if (index >= 0) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= children.length) return { root: copy, moved: false };
    [children[index], children[nextIndex]] = [children[nextIndex], children[index]];
    copy.children = children;
    return { root: copy, moved: true };
  }
  for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
    const result = moveSibling(children[childIndex], targetId, delta);
    if (result.moved) {
      children[childIndex] = result.root;
      copy.children = children;
      return { root: copy, moved: true };
    }
  }
  return { root: copy, moved: false };
}

function parentIdOf(root: NodeObj, targetId: string): string | undefined {
  for (const child of root.children ?? []) {
    if (child.id === targetId) return root.id;
    const result = parentIdOf(child, targetId);
    if (result) return result;
  }
  return undefined;
}

function canvasNodeToGraph(node: MindMapCanvasNode): MindMapGraphNode {
  return {
    id: node.id,
    type: "mindmap",
    position: { x: node.position.x, y: node.position.y },
    data: { label: node.data.label, node: node.data.node },
  };
}

function graphWithCanvasNodes(graph: MindMapGraph, nodes: readonly MindMapCanvasNode[]): MindMapGraph {
  return { ...graph, nodes: nodes.map(canvasNodeToGraph) };
}

function hasPath(edges: MindMapGraph["edges"], from: string, target: string, seen = new Set<string>()): boolean {
  if (from === target) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return edges.filter((edge) => edge.source === from).some((edge) => hasPath(edges, edge.target, target, seen));
}

export default function MindmapUi() {
  const inputRef = useRef<HTMLInputElement>(null);
  const flowRef = useRef<ReactFlowInstance<MindMapCanvasNode, MindMapCanvasEdge> | null>(null);
  const initial = useMemo(() => createEmptyDocument(), []);
  const [snapshot, setSnapshot] = useState<MindElixirData>(initial);
  const [graph, setGraph] = useState<MindMapGraph>(() => mindElixirDataToGraph(initial));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelId>(null);
  const [query, setQuery] = useState("");
  const [themeId, setThemeId] = useState<ThemePresetId>(DEFAULT_THEME_ID);
  const [direction, setDirection] = useState<DirectionId>("right");
  const [compact, setCompact] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"free" | "mindmap" | "tree">("free");
  const [edgeKind, setEdgeKind] = useState<"hierarchy" | "relationship">("hierarchy");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<MindElixirData[]>([]);
  const [future, setFuture] = useState<MindElixirData[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [edgeLabelDraft, setEdgeLabelDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [iconsDraft, setIconsDraft] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOperation, setAiOperation] = useState<MindmapOperation>("replace");
  const [aiTemplate, setAiTemplate] = useState<MindmapTemplate>("project-plan");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPreview, setAiPreview] = useState<MindElixirData | null>(null);
  const [aiPreviewCount, setAiPreviewCount] = useState(0);
  const aiAbortRef = useRef<AbortController | null>(null);

  const selectedId = selectedIds[selectedIds.length - 1];
  const selectedNode = useMemo(() => flattenNodes(snapshot.nodeData).find(({ node }) => node.id === selectedId)?.node, [selectedId, snapshot.nodeData]);
  const selectedEdge = useMemo(() => graph.edges.find((edge) => edge.id === selectedEdgeId), [graph.edges, selectedEdgeId]);
  const outline = useMemo(() => filterOutline(snapshot ? flattenNodes(snapshot.nodeData) : [], query), [query, snapshot]);

  const callbacks = useMemo(() => ({
    onBeginEdit: (id: string) => setEditingId(id),
    onCommitEdit: (id: string, value: string) => {
      const nextRoot = mapTreeNode(snapshot.nodeData, id, (node) => ({ ...node, topic: value }));
      const nextData = { ...snapshot, nodeData: nextRoot };
      setHistory((items) => [...items, snapshot].slice(-MAX_HISTORY));
      setFuture([]);
      setSnapshot(nextData);
      setGraph(mindElixirDataToGraph(nextData));
      setEditingId(null);
      setError("");
    },
    onCancelEdit: () => setEditingId(null),
  }), [snapshot]);

  const commitGraph = useCallback((nextGraph: MindMapGraph, baseData = snapshot) => {
    try {
      const nextData = graphToMindElixirData(nextGraph, baseData);
      setHistory((items) => [...items, snapshot].slice(-MAX_HISTORY));
      setFuture([]);
      setGraph(nextGraph);
      setSnapshot(nextData);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "画布数据无效。");
    }
  }, [snapshot]);

  const replaceDocument = useCallback((data: MindElixirData, record = true) => {
    try {
      if (!isSafeMindMapData(data)) throw new Error("文件不是有效或安全的思维导图快照。");
      const nextGraph = mindElixirDataToGraph(data);
      const normalized = updateMindElixirDataPositions(data, nextGraph.nodes);
      if (record) setHistory((items) => [...items, snapshot].slice(-MAX_HISTORY));
      setFuture([]);
      setSnapshot(normalized);
      setGraph(nextGraph);
      setSelectedIds([]);
      setEditingId(null);
      const nextTheme = themeOptions.find((option) => option.value === data.meta?.mindmapTheme)?.value as ThemePresetId | undefined;
      if (nextTheme) setThemeId(nextTheme);
      setDirection(data.direction === 0 ? "left" : data.direction === 2 ? "side" : data.direction === 3 ? "down" : "right");
      setCompact(Boolean(data.compact));
      setLayoutMode(data.meta?.layout === "mindmap" || data.meta?.layout === "tree" ? data.meta.layout : "free");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取思维导图快照。");
    }
  }, [snapshot]);

  const updateNodeDrafts = (node: NodeObj | undefined) => {
    setNoteDraft(node?.note ?? "");
    setLinkDraft(node?.hyperLink ?? "");
    setTagsDraft((node?.tags ?? []).map((tag) => typeof tag === "string" ? tag : tag.text).join(", "));
    setIconsDraft((node?.icons ?? []).join(" "));
  };

  const handleNodeClick = (event: ReactMouseEvent, node: MindMapCanvasNode) => {
    const multi = event.shiftKey || event.metaKey || event.ctrlKey;
    setSelectedEdgeId(null);
    setSelectedIds((current) => multi ? (current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id]) : [node.id]);
    updateNodeDrafts(node.data.node);
    setError("");
  };

  const handleEdgeClick = (_event: ReactMouseEvent, edge: MindMapCanvasEdge) => {
    setSelectedIds([]);
    setSelectedEdgeId(edge.id);
    setEdgeLabelDraft(edge.data?.label ?? "");
    setError("");
  };

  const handleNodesChange = (changes: NodeChange<MindMapCanvasNode>[]) => {
    const removedIds = changes.filter((change) => change.type === "remove").map((change) => change.id);
    if (removedIds.length) {
      let nextRoot = snapshot.nodeData;
      for (const id of removedIds) {
        if (id === snapshot.nodeData.id) {
          setError("根节点不能删除。");
          return;
        }
        const result = removeFromTree(nextRoot, id);
        if (!result.removed) {
          setError("节点已经不存在。");
          return;
        }
        nextRoot = result.root;
      }
      const nextData = { ...snapshot, nodeData: nextRoot };
      commitGraph(mindElixirDataToGraph(nextData), nextData);
      setSelectedIds((current) => current.filter((id) => !removedIds.includes(id)));
      return;
    }
    setGraph((current) => {
      const rootId = current.nodes.find((node) => !current.edges.some((edge) => edge.target === node.id))?.id ?? "";
      const flow = graphToCanvas(current, rootId, callbacks, editingId);
      const changed = applyNodeChanges(changes, flow.nodes);
      setSelectedIds(changed.filter((node) => node.selected).map((node) => node.id));
      return graphWithCanvasNodes(current, changed);
    });
  };

  const handleNodeDragStop = (_event: MouseEvent | TouchEvent, _node: MindMapCanvasNode, nodes: MindMapCanvasNode[]) => {
    const positions = positionsFromGraphNodes(graph.nodes.map((item) => {
      const moved = nodes.find((node) => node.id === item.id);
      return moved ? canvasNodeToGraph(moved) : item;
    }));
    const nextGraph: MindMapGraph = {
      ...graph,
      nodes: graph.nodes.map((item) => {
        const moved = nodes.find((node) => node.id === item.id);
        return moved ? canvasNodeToGraph(moved) : item;
      }),
    };
    const nextData: MindElixirData = {
      ...snapshot,
      meta: { ...(snapshot.meta ?? {}), positions, layout: "free" },
    };
    setHistory((items) => [...items, snapshot].slice(-MAX_HISTORY));
    setFuture([]);
    setGraph(nextGraph);
    setSnapshot(nextData);
    setLayoutMode("free");
  };

  const handleEdgesChange = (changes: EdgeChange<MindMapCanvasEdge>[]) => {
    const removedIds = changes.filter((change) => change.type === "remove").map((change) => change.id);
    if (!removedIds.length) return;
    const removedEdges = graph.edges.filter((edge) => removedIds.includes(edge.id));
    if (removedEdges.some((edge) => edge.data?.kind !== "relationship")) {
      setError("层级边不能直接删除；请删除节点或重新连接层级关系。");
      return;
    }
    const nextGraph: MindMapGraph = { ...graph, edges: graph.edges.filter((edge) => !removedIds.includes(edge.id)) };
    commitGraph(nextGraph, snapshot);
  };

  const handleConnect = (connection: Connection) => {
    if (!connection.source || !connection.target || connection.source === connection.target) {
      setError("不能连接节点自身。");
      return;
    }
    if (edgeKind === "relationship") {
      const nextGraph: MindMapGraph = {
        ...graph,
        edges: [...graph.edges, { id: `relationship-${newId()}`, source: connection.source, target: connection.target, type: "mindmap", data: { kind: "relationship" as const, label: "" } }],
      };
      commitGraph(nextGraph);
      return;
    }
    if (graph.edges.some((edge) => edge.data?.kind !== "relationship" && edge.target === connection.target)) {
      setError("该节点已经有父节点。");
      return;
    }
    if (hasPath(graph.edges.filter((edge) => edge.data?.kind !== "relationship"), connection.target, connection.source)) {
      setError("不能创建循环层级关系。");
      return;
    }
    const nextGraph = {
      ...graph,
      edges: [...graph.edges, { id: `${connection.source}->${connection.target}-${newId()}`, source: connection.source, target: connection.target, type: "mindmap", data: { kind: "hierarchy" as const } }],
    };
    commitGraph(nextGraph);
  };

  const addNode = (kind: "child" | "sibling" | "parent") => {
    const target = selectedNode;
    if (!target) {
      setError("请先选择一个节点。");
      return;
    }
    const nextNode: NodeObj = { id: newId(), topic: kind === "parent" ? "新父节点" : "新节点" };
    let nextRoot = snapshot.nodeData;
    if (kind === "child") nextRoot = mapTreeNode(nextRoot, target.id, (node) => ({ ...node, children: [...(node.children ?? []), nextNode] }));
    if (kind === "sibling") {
      const result = insertAfter(nextRoot, target.id, nextNode);
      if (!result.inserted) { setError("无法插入同级节点。"); return; }
      nextRoot = result.root;
    }
    if (kind === "parent") {
      const parentId = parentIdOf(nextRoot, target.id);
      const parentNode: NodeObj = { ...nextNode, children: [cloneNode(target)] };
      if (!parentId) nextRoot = parentNode;
      else nextRoot = mapTreeNode(nextRoot, parentId, (node) => ({ ...node, children: node.children?.map((child) => child.id === target.id ? parentNode : child) }));
    }
    const nextData = { ...snapshot, nodeData: nextRoot, meta: { ...(snapshot.meta ?? {}), layout: "free" } };
    const nextGraph = mindElixirDataToGraph(nextData);
    const targetPosition = graph.nodes.find((node) => node.id === target.id)?.position ?? { x: 0, y: 0 };
    const inserted = nextGraph.nodes.find((node) => node.id === nextNode.id);
    if (inserted) inserted.position = { x: targetPosition.x + (kind === "parent" ? -280 : 280), y: targetPosition.y + (kind === "sibling" ? 110 : 0) };
    commitGraph(nextGraph, nextData);
    setSelectedIds([nextNode.id]);
  };

  const removeSelected = () => {
    if (!selectedId) { setError("请先选择一个节点。"); return; }
    if (selectedId === snapshot.nodeData.id) { setError("根节点不能删除。"); return; }
    const result = removeFromTree(snapshot.nodeData, selectedId);
    if (!result.removed) { setError("节点已经不存在。"); return; }
    const nextData = { ...snapshot, nodeData: result.root };
    commitGraph(mindElixirDataToGraph(nextData), nextData);
    setSelectedIds([]);
  };

  const moveSelected = (delta: -1 | 1) => {
    if (!selectedId) { setError("请先选择一个节点。"); return; }
    const result = moveSibling(snapshot.nodeData, selectedId, delta);
    if (!result.moved) { setError("当前节点无法继续移动。"); return; }
    const nextData = { ...snapshot, nodeData: result.root };
    commitGraph(mindElixirDataToGraph(nextData), nextData);
  };

  const toggleExpanded = () => {
    if (!selectedId) { setError("请先选择一个节点。"); return; }
    const nextRoot = mapTreeNode(snapshot.nodeData, selectedId, (node) => ({ ...node, expanded: node.expanded === false }));
    const nextData = { ...snapshot, nodeData: nextRoot };
    commitGraph(mindElixirDataToGraph(nextData), nextData);
  };

  const applyStyle = (style: Partial<NonNullable<NodeObj["style"]>>) => {
    if (!selectedNode) { setError("请先选择一个节点。"); return; }
    const nextRoot = mapTreeNode(snapshot.nodeData, selectedNode.id, (node) => ({ ...node, style: mergeNodeStyle(node, style).style }));
    const nextData = { ...snapshot, nodeData: nextRoot };
    commitGraph(mindElixirDataToGraph(nextData), nextData);
  };

  const saveDetails = () => {
    if (!selectedNode) { setError("请先选择一个节点。"); return; }
    if (!isSafeHyperlink(linkDraft.trim())) { setError("链接仅支持 http、https 或 mailto 地址。"); return; }
    const nextRoot = mapTreeNode(snapshot.nodeData, selectedNode.id, (node) => ({ ...node, note: noteDraft.trim() || undefined, hyperLink: linkDraft.trim() || undefined, tags: parseTags(tagsDraft), icons: parseIcons(iconsDraft) }));
    const nextData = { ...snapshot, nodeData: nextRoot };
    commitGraph(mindElixirDataToGraph(nextData), nextData);
    updateNodeDrafts(flattenNodes(nextRoot).find(({ node }) => node.id === selectedNode.id)?.node);
  };

  const saveEdgeLabel = () => {
    if (!selectedEdge) { setError("请先选择一条关系线。"); return; }
    if (selectedEdge.data?.kind !== "relationship") { setError("层级线不支持标签。"); return; }
    const nextGraph: MindMapGraph = {
      ...graph,
      edges: graph.edges.map((edge) => edge.id === selectedEdge.id ? { ...edge, data: { ...edge.data, kind: "relationship", label: edgeLabelDraft.trim().slice(0, 500) } } : edge),
    };
    commitGraph(nextGraph, snapshot);
  };

  const changeTheme = (value: string) => {
    const id = value as ThemePresetId;
    const nextData = { ...snapshot, theme: getThemePreset(id).theme, meta: { ...(snapshot.meta ?? {}), mindmapTheme: id } };
    setThemeId(id);
    commitGraph(graph, nextData);
  };

  const applyAutoLayout = (nextDirection: DirectionId) => {
    const positions = createAutoLayoutPositions(snapshot.nodeData, nextDirection, compact);
    const directionValue: MindElixirData["direction"] = nextDirection === "left" ? 0 : nextDirection === "side" ? 2 : nextDirection === "down" ? 3 : 1;
    const nextGraph = { ...graph, nodes: graph.nodes.map((node) => ({ ...node, position: positions[node.id] ?? node.position })) };
    const nextData: MindElixirData = { ...snapshot, direction: directionValue, meta: { ...(snapshot.meta ?? {}), positions, layout: nextDirection === "down" ? "tree" : "mindmap" } };
    setDirection(nextDirection);
    setLayoutMode(nextDirection === "down" ? "tree" : "mindmap");
    commitGraph(nextGraph, nextData);
    requestAnimationFrame(() => { void flowRef.current?.fitView({ padding: 0.24, duration: 240 }); });
  };

  const changeCompact = (value: boolean) => {
    setCompact(value);
    commitGraph(graph, { ...snapshot, compact: value });
  };

  const undo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((items) => items.slice(0, -1));
    setFuture((items) => [snapshot, ...items].slice(0, MAX_HISTORY));
    replaceDocument(previous, false);
  };

  const redo = () => {
    const next = future[0];
    if (!next) return;
    setFuture((items) => items.slice(1));
    setHistory((items) => [...items, snapshot].slice(-MAX_HISTORY));
    replaceDocument(next, false);
  };

  const resetMindmap = () => replaceDocument(createEmptyDocument());

  const importMindmap = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) { setError("文件过大，请选择 10 MB 以内的快照。"); return; }
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!isSafeMindMapData(data)) throw new Error("文件不是有效或安全的思维导图快照。");
      replaceDocument(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取思维导图快照。");
    }
  };

  const exportJson = () => downloadText(JSON.stringify(snapshot, null, 2), "思维导图.mindmap.json", "application/json;charset=utf-8");
  const exportOutline = (format: "markdown" | "text") => downloadText(format === "markdown" ? toMarkdown(snapshot.nodeData) : toPlainText(snapshot.nodeData), `思维导图.${format === "markdown" ? "md" : "txt"}`, "text/plain;charset=utf-8");
  const exportImage = async (format: "svg" | "png") => {
    const element = document.querySelector(".mindmap-flow .react-flow__viewport") as HTMLElement | null;
    if (!element) return;
    try {
      const { toPng, toSvg } = await import("html-to-image");
      if (format === "svg") downloadText(await toSvg(element, { backgroundColor: "var(--background)" }), "思维导图.svg", "image/svg+xml;charset=utf-8");
      else downloadDataUrl(await toPng(element, { backgroundColor: "var(--background)", pixelRatio: 2 }), "思维导图.png");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出图片失败。");
    }
  };

  const openInspector = () => {
    if (selectedNode) updateNodeDrafts(selectedNode);
    setPanel("inspector");
  };

  const openAi = () => {
    setAiError("");
    setAiPreview(null);
    setPanel("ai");
  };

  const generateWithAi = async () => {
    const prompt = aiPrompt.trim();
    const config = loadLLMConfig();
    if (!prompt) { setAiError("请先描述你想绘制或修改的内容。"); return; }
    if (!config?.provider || !config.model || !config.api_key) { setAiError("请先在系统设置中配置 provider、模型和 API Key。"); return; }
    if (aiOperation === "append" && !selectedNode) { setAiError("追加操作需要先选中一个节点。"); return; }
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiBusy(true);
    setAiError("");
    try {
      const response = await generateMindmap({ prompt, operation: aiOperation, template: aiTemplate, direction, compact, selected_node_id: aiOperation === "append" ? selectedNode?.id : undefined, current_data: aiOperation === "replace" ? undefined : snapshot, provider: config.provider, model: config.model, api_key: config.api_key }, controller.signal);
      if (!isSafeMindMapData(response.data)) throw new Error("模型返回的导图未通过安全校验。");
      setAiPreview(response.data);
      setAiPreviewCount(response.node_count);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setAiError(cause instanceof Error ? cause.message : "AI 生成失败，请稍后重试。");
    } finally {
      if (aiAbortRef.current === controller) { aiAbortRef.current = null; setAiBusy(false); }
    }
  };

  const applyAiPreview = () => {
    if (!aiPreview) return;
    const aiPositions = aiPreview.meta?.positions ?? {};
    const currentPositions = snapshot.meta?.positions ?? {};
    const preserveCurrent = aiOperation !== "replace";
    const merged: MindElixirData = {
      ...aiPreview,
      theme: snapshot.theme,
      arrows: aiOperation === "replace" ? aiPreview.arrows : aiPreview.arrows ?? snapshot.arrows,
      meta: {
        ...(snapshot.meta ?? {}),
        ...(aiPreview.meta ?? {}),
        positions: preserveCurrent ? { ...aiPositions, ...currentPositions } : aiPositions,
        viewport: snapshot.meta?.viewport,
        layout: "free",
      },
    };
    const mergedGraph = mindElixirDataToGraph(merged);
    if (aiOperation === "append" && selectedNode) {
      const selectedPosition = graph.nodes.find((node) => node.id === selectedNode.id)?.position ?? { x: 0, y: 0 };
      const currentIds = new Set(graph.nodes.map((node) => node.id));
      let newIndex = 0;
      for (const node of mergedGraph.nodes) {
        if (!currentIds.has(node.id)) {
          node.position = { x: selectedPosition.x + 320, y: selectedPosition.y + newIndex * (compact ? 100 : 132) - 44 };
          newIndex += 1;
        }
      }
    }
    replaceDocument(updateMindElixirDataPositions(merged, mergedGraph.nodes));
    setPanel(null);
    setAiPreview(null);
  };

  const fitCanvas = () => { void flowRef.current?.fitView({ padding: 0.24, duration: 240 }); };
  const handleInit = (instance: ReactFlowInstance<MindMapCanvasNode, MindMapCanvasEdge>) => { flowRef.current = instance; };
  const defaultViewport = useMemo<Viewport | undefined>(() => {
    const viewport = snapshot.meta?.viewport;
    if (!viewport || typeof viewport.x !== "number" || typeof viewport.y !== "number" || typeof viewport.zoom !== "number") return undefined;
    return { x: viewport.x, y: viewport.y, zoom: viewport.zoom };
  }, [snapshot.meta]);
  const handleMoveEnd: OnMoveEnd = (_event, viewport) => {
    setSnapshot((current) => ({ ...current, meta: { ...(current.meta ?? {}), viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom } } }));
  };

  const inspector = (
    <aside className="mindmap-floating-sidebar absolute inset-y-3 right-3 z-30 flex w-[min(22rem,calc(100%-1.5rem))] flex-col bg-background/95 p-4 shadow-2xl" aria-label="节点检查器">
      <div className="mb-4 flex items-center justify-between">
        <div><p className="text-sm font-semibold">节点检查器</p><p className="text-xs text-muted-foreground">编辑内容与视觉样式</p></div>
        <Button variant="ghost" size="sm" onClick={() => setPanel(null)} aria-label="关闭节点检查器"><X className="h-4 w-4" /></Button>
      </div>
      {selectedNode ? <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <section className="space-y-2"><div className="flex items-center gap-2 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" />内容</div>
          <TextArea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="节点备注…" rows={4} mono={false} maxLength={5000} />
          <TextField value={linkDraft} onChange={(event) => setLinkDraft(event.target.value)} placeholder="https://example.com" type="url" maxLength={2000} />
          <TextField value={tagsDraft} onChange={(event) => setTagsDraft(event.target.value)} placeholder="标签，用逗号分隔" maxLength={800} />
          <TextField value={iconsDraft} onChange={(event) => setIconsDraft(event.target.value)} placeholder="图标，用空格分隔" maxLength={120} />
          <div className="flex flex-wrap gap-1.5">{iconOptions.map((icon) => <Button key={icon} variant={parseIcons(iconsDraft).includes(icon) ? "primary" : "outline"} size="sm" onClick={() => setIconsDraft(parseIcons(iconsDraft).includes(icon) ? parseIcons(iconsDraft).filter((item) => item !== icon).join(" ") : [...parseIcons(iconsDraft), icon].join(" "))} aria-label={`切换${icon}图标`}>{icon}</Button>)}</div>
          <Button variant="primary" size="sm" className="w-full" onClick={saveDetails}><Check className="h-3.5 w-3.5" />保存内容</Button>
        </section>
        <section className="space-y-2 border-t border-border pt-4"><div className="flex items-center gap-2 text-xs font-semibold"><Palette className="h-3.5 w-3.5" />样式</div>
          <div className="grid grid-cols-2 gap-2"><label className="text-[11px] text-muted-foreground">文字<input type="color" value={colorInputValue(selectedNode.style?.color, "#1e293b")} onChange={(event) => applyStyle({ color: event.target.value })} className="mt-1 h-8 w-full rounded border border-input bg-background p-1" /></label><label className="text-[11px] text-muted-foreground">背景<input type="color" value={colorInputValue(selectedNode.style?.background, "#ffffff")} onChange={(event) => applyStyle({ background: event.target.value })} className="mt-1 h-8 w-full rounded border border-input bg-background p-1" /></label></div>
          <div className="grid grid-cols-2 gap-2"><Select value={selectedNode.style?.fontSize ?? "16px"} onChange={(value) => applyStyle({ fontSize: value })} options={["14px", "16px", "18px", "20px", "24px", "28px"].map((value) => ({ value, label: value }))} ariaLabel="节点字号" /><Select value={selectedNode.style?.width ?? "auto"} onChange={(value) => applyStyle({ width: value === "auto" ? undefined : value })} options={[{ value: "auto", label: "自动宽度" }, { value: "160px", label: "窄卡片" }, { value: "220px", label: "标准卡片" }, { value: "280px", label: "宽卡片" }]} ariaLabel="节点宽度" /></div>
          <div className="flex gap-2"><Button variant={selectedNode.style?.fontWeight === "bold" ? "primary" : "outline"} size="sm" onClick={() => applyStyle({ fontWeight: selectedNode.style?.fontWeight === "bold" ? "normal" : "bold" })}><Bold className="h-3.5 w-3.5" />粗体</Button><Button variant={selectedNode.style?.textDecoration === "underline" ? "primary" : "outline"} size="sm" onClick={() => applyStyle({ textDecoration: selectedNode.style?.textDecoration === "underline" ? "none" : "underline" })}><Underline className="h-3.5 w-3.5" />下划线</Button></div>
        </section>
      </div> : selectedEdge ? <div className="min-h-0 flex-1 space-y-4 overflow-y-auto"><section className="space-y-2"><div className="flex items-center gap-2 text-xs font-semibold"><Link2 className="h-3.5 w-3.5" />关系线</div><p className="text-xs text-muted-foreground">为关系线添加说明标签。层级线由节点结构自动维护。</p><TextField value={edgeLabelDraft} onChange={(event) => setEdgeLabelDraft(event.target.value)} placeholder="关系说明" maxLength={500} /><Button variant="primary" size="sm" className="w-full" onClick={saveEdgeLabel}><Check className="h-3.5 w-3.5" />保存关系线</Button></section></div> : <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">先选择节点或关系线，再编辑属性。</div>}
    </aside>
  );

  const outlinePanel = (
    <aside className="mindmap-floating-sidebar absolute inset-y-3 left-3 z-30 flex w-[min(19rem,calc(100%-1.5rem))] flex-col bg-background/95 p-4 shadow-2xl" aria-label="导图大纲">
      <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">导图大纲</p><p className="text-xs text-muted-foreground">搜索并定位节点</p></div><Button variant="ghost" size="sm" onClick={() => setPanel(null)} aria-label="关闭导图大纲"><X className="h-4 w-4" /></Button></div>
      <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索主题、备注或标签" aria-label="搜索思维导图" />
      <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">{outline.map(({ node, depth, path }) => <button key={node.id} type="button" onClick={() => { setSelectedIds([node.id]); updateNodeDrafts(node); setPanel(null); }} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-xs hover:bg-muted" style={{ paddingLeft: `${8 + depth * 14}px` }}><span className="shrink-0 text-[10px] text-muted-foreground">{path}</span><span className="truncate">{node.topic}</span></button>)}{outline.length === 0 && <p className="p-3 text-xs text-muted-foreground">没有匹配的节点。</p>}</div>
    </aside>
  );

  const aiPanel = (
    <aside className="mindmap-floating-sidebar absolute inset-y-3 right-3 z-40 flex w-[min(28rem,calc(100%-1.5rem))] flex-col bg-background/98 p-4 shadow-2xl" aria-label="AI 思维导图助手">
      <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background"><Bot className="h-4 w-4" /></span><div><p className="text-sm font-semibold">AI 思维导图助手</p><p className="text-xs text-muted-foreground">独立生成、预览，再应用到画布</p></div></div><Button variant="ghost" size="sm" onClick={() => { aiAbortRef.current?.abort(); setPanel(null); }} disabled={aiBusy} aria-label="关闭 AI 助手"><X className="h-4 w-4" /></Button></div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto"><div className="grid gap-2 sm:grid-cols-2"><Select value={aiOperation} onChange={(value) => { setAiOperation(value as MindmapOperation); setAiPreview(null); }} options={aiOperationOptions} ariaLabel="AI 操作" /><Select value={aiTemplate} onChange={(value) => { setAiTemplate(value as MindmapTemplate); setAiPreview(null); }} options={aiTemplateOptions.map(({ value, label }) => ({ value, label }))} ariaLabel="AI 模板" /></div><div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">{aiTemplateOptions.find(({ value }) => value === aiTemplate)?.description}{aiOperation === "append" && <span className="ml-2 font-medium text-foreground">{selectedNode ? `追加到：${selectedNode.topic}` : "请先选中节点"}</span>}</div><TextArea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder={aiOperation === "append" ? "例如：补充验收标准、风险和负责人…" : "例如：绘制一个网站发布计划，包含阶段、任务、负责人和风险…"} rows={6} mono={false} maxLength={8000} aria-label="描述要生成的思维导图" /><div className="flex items-start gap-2 rounded-lg border border-border p-3 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />API Key 只从本地系统设置读取，不写入导图、URL 或日志。</div>{aiError && <ErrorBox>{aiError}</ErrorBox>}{aiPreview && <div className="space-y-2 rounded-lg border border-brand/40 bg-brand/5 p-3"><div className="flex items-center justify-between text-sm font-semibold"><span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />生成预览</span><span className="text-xs text-muted-foreground">{aiPreviewCount} 个节点</span></div><div className="max-h-48 overflow-y-auto rounded border border-border bg-background p-2">{flattenNodes(aiPreview.nodeData).slice(0, 40).map(({ node, depth, path }) => <div key={node.id} className="flex gap-2 py-1 text-xs" style={{ paddingLeft: `${depth * 14}px` }}><span className="text-muted-foreground">{path}</span><span className="truncate">{node.topic}</span></div>)}</div></div>}</div>
      <footer className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">{aiBusy ? <Button variant="outline" size="sm" onClick={() => { aiAbortRef.current?.abort(); setAiBusy(false); }}><X className="h-3.5 w-3.5" />取消</Button> : <Button variant="outline" size="sm" onClick={() => setAiPreview(null)} disabled={!aiPreview}>清除预览</Button>}<Button variant="outline" size="sm" onClick={() => void generateWithAi()} disabled={aiBusy || !aiPrompt.trim()}><Send className="h-3.5 w-3.5" />{aiPreview ? "重新生成" : "生成预览"}</Button><Button variant="primary" size="sm" onClick={applyAiPreview} disabled={aiBusy || !aiPreview}><Check className="h-3.5 w-3.5" />应用到画布</Button></footer>
    </aside>
  );

  return (
    <ToolShell icon={meta.icon} title={meta.name} description="自由摆放节点，保留结构关系；支持 AI、主题、导入导出" local wide>
      <div className="-mt-4 flex h-[calc(100dvh-8rem)] min-h-[640px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <input ref={inputRef} type="file" accept=".json,application/json" onChange={importMindmap} className="sr-only" />
        <header className="flex min-h-12 flex-wrap items-center gap-1.5 border-b border-border bg-card/90 px-3 py-2 backdrop-blur-md">
          <div className="mr-2 flex min-w-0 items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted"><GitBranch className="h-4 w-4" /></span><span className="max-w-40 truncate text-sm font-semibold">未命名思维导图</span><span className="hidden text-[11px] text-muted-foreground sm:inline">· 本地处理，不自动保存</span></div>
          <Button variant="ghost" size="sm" onClick={undo} disabled={!history.length} aria-label="撤销"><Undo2 className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={redo} disabled={!future.length} aria-label="重做"><Redo2 className="h-4 w-4" /></Button>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} aria-label="导入 JSON"><FileUp className="h-3.5 w-3.5" />导入</Button><div className="group relative"><Button variant="outline" size="sm" aria-label="导出菜单"><Download className="h-3.5 w-3.5" />导出<ChevronDown className="h-3 w-3" /></Button><div className="invisible absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-border bg-popover p-1 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"><button type="button" onClick={exportJson} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"><FileDown className="h-3.5 w-3.5" />JSON</button><button type="button" onClick={() => exportOutline("markdown")} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"><FileText className="h-3.5 w-3.5" />Markdown</button><button type="button" onClick={() => exportOutline("text")} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"><FileOutput className="h-3.5 w-3.5" />纯文本</button><button type="button" onClick={() => void exportImage("svg")} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted">SVG</button><button type="button" onClick={() => void exportImage("png")} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted">PNG</button></div></div>
          <Button variant="outline" size="sm" onClick={resetMindmap} aria-label="新建导图"><RotateCcw className="h-3.5 w-3.5" />新建</Button><Button variant="primary" size="sm" onClick={openAi} aria-label="打开 AI 思维导图助手"><Sparkles className="h-3.5 w-3.5" />AI 助手</Button><Button variant="ghost" size="sm" onClick={() => setPanel(panel === "outline" ? null : "outline")} aria-label="打开导图大纲"><PanelLeft className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={openInspector} aria-label="打开节点检查器"><PanelRight className="h-4 w-4" /></Button>
          <span className="ml-auto hidden text-[11px] text-muted-foreground lg:inline">{selectedIds.length ? `已选 ${selectedIds.length} 个节点` : "拖动节点自由摆放"}</span>
        </header>
        {error && <div className="absolute z-50 mx-3 mt-14 max-w-md"><ErrorBox>{error}</ErrorBox></div>}
        <div className="relative min-h-0 flex-1">
          <MindMapCanvas graph={graph} selectedIds={selectedIds} editingId={editingId} theme={snapshot.theme} {...callbacks} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onNodeDragStop={handleNodeDragStop} onNodeClick={handleNodeClick} onEdgeClick={handleEdgeClick} onPaneClick={() => { setSelectedIds([]); setSelectedEdgeId(null); }} onConnect={handleConnect} onMoveEnd={handleMoveEnd} defaultViewport={defaultViewport} onInit={handleInit} />
          <div className="mindmap-floating-toolbar absolute left-3 top-16 z-20 flex flex-col gap-1 rounded-xl border border-border bg-card/90 p-1.5 shadow-xl backdrop-blur-md" aria-label="画布工具">
            <Button variant="ghost" size="sm" title="选择" aria-label="选择工具"><MousePointer2 className="h-4 w-4" /></Button><Button variant="ghost" size="sm" title="平移画布" aria-label="平移工具"><Hand className="h-4 w-4" /></Button><span className="my-0.5 h-px bg-border" /><Button variant="ghost" size="sm" onClick={() => addNode("child")} disabled={!selectedNode} title="添加子节点" aria-label="添加子节点"><Plus className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => addNode("sibling")} disabled={!selectedNode} title="添加同级节点" aria-label="添加同级节点"><GitBranch className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={openInspector} disabled={!selectedNode} title="节点属性" aria-label="节点属性"><Settings2 className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => setPanel(panel === "outline" ? null : "outline")} title="大纲搜索" aria-label="大纲搜索"><Search className="h-4 w-4" /></Button>
          </div>
          <div className="absolute right-3 top-16 z-20 flex items-center gap-2 rounded-xl border border-border bg-card/90 p-1.5 shadow-xl backdrop-blur-md"><Select value={themeId} onChange={changeTheme} options={themeOptions} ariaLabel="画布主题" className="w-32" /><Button variant={compact ? "primary" : "ghost"} size="sm" onClick={() => changeCompact(!compact)} title="切换紧凑布局" aria-label="切换紧凑布局">紧凑</Button><Button variant={edgeKind === "relationship" ? "primary" : "ghost"} size="sm" onClick={() => setEdgeKind(edgeKind === "hierarchy" ? "relationship" : "hierarchy")} title={edgeKind === "hierarchy" ? "连接将创建层级边" : "连接将创建关系线"} aria-label="切换连接类型"><Link2 className="h-3.5 w-3.5" />{edgeKind === "hierarchy" ? "层级" : "关系"}</Button></div>
          {selectedNode && <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md"><span className="max-w-36 truncate px-2 text-xs font-medium">{selectedNode.topic}</span><Button variant="ghost" size="sm" onClick={() => { setEditingId(selectedNode.id); }} title="编辑主题" aria-label="编辑主题"><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => addNode("child")} title="添加子节点" aria-label="添加子节点"><Plus className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => addNode("sibling")} title="添加同级节点" aria-label="添加同级节点"><GitBranch className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => toggleExpanded()} title="折叠或展开" aria-label="折叠或展开">折叠</Button><Button variant="ghost" size="sm" onClick={() => moveSelected(-1)} title="同级上移" aria-label="同级上移"><ChevronUp className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => moveSelected(1)} title="同级下移" aria-label="同级下移"><ChevronDown className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" onClick={openInspector} title="打开检查器" aria-label="打开检查器"><PanelRight className="h-3.5 w-3.5" /></Button><Button variant="destructive" size="sm" onClick={removeSelected} title="删除节点" aria-label="删除节点"><Trash2 className="h-3.5 w-3.5" /></Button></div>}
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-lg backdrop-blur-md"><Button variant={layoutMode === "free" ? "primary" : "ghost"} size="sm" onClick={() => setLayoutMode("free")} title="自由摆放" aria-label="自由摆放"><Maximize2 className="h-3.5 w-3.5" /></Button><div className="group relative"><Button variant="ghost" size="sm" title="自动布局" aria-label="自动布局"><Layout className="h-3.5 w-3.5" /><ChevronDown className="h-3 w-3" /></Button><div className="invisible absolute bottom-full left-0 mb-1 w-28 rounded-lg border border-border bg-popover p-1 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">{directionOptions.map((option) => <button type="button" key={option.value} onClick={() => applyAutoLayout(option.value)} className="block w-full rounded px-2 py-1.5 text-left text-xs hover:bg-muted">{option.label}</button>)}</div></div><Button variant="ghost" size="sm" onClick={fitCanvas} title="适应画布" aria-label="适应画布"><LocateFixed className="h-3.5 w-3.5" /></Button><span className="hidden pl-1 text-[11px] text-muted-foreground sm:inline">{layoutMode === "free" ? "自由摆放" : `自动布局 · ${directionOptions.find((item) => item.value === direction)?.label}`}</span></div>
          {panel === "outline" && outlinePanel}{panel === "inspector" && inspector}{panel === "ai" && aiPanel}
        </div>
        <footer className="flex min-h-9 items-center justify-between border-t border-border bg-card/70 px-3 text-[11px] text-muted-foreground"><span>拖拽节点到任意位置 · Shift 框选 · 双击或 Enter 编辑</span><span className="hidden items-center gap-2 sm:flex"><button type="button" onClick={() => void flowRef.current?.zoomOut()} aria-label="缩小"><ZoomOut className="h-3.5 w-3.5" /></button><span>画布</span><button type="button" onClick={() => void flowRef.current?.zoomIn()} aria-label="放大"><ZoomIn className="h-3.5 w-3.5" /></button></span></footer>
      </div>
    </ToolShell>
  );
}
