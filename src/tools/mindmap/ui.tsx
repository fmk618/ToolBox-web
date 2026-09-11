"use client";

import type { ChangeEvent } from "react";
import type { MindElixirData, MindElixirInstance, NodeObj, Theme } from "mind-elixir";
import {
  Bold,
  Bot,
  Check,
  CircleHelp,
  Columns2,
  Expand,
  FileDown,
  FileOutput,
  FileText,
  FileUp,
  Flame,
  FoldVertical,
  GitBranch,
  Layout,
  Lightbulb,
  Link2,
  LocateFixed,
  MoveDown,
  MoveUp,
  Paintbrush,
  PanelLeft,
  PanelRight,
  Pencil,
  Pin,
  Plus,
  Redo2,
  Rocket,
  RotateCcw,
  RotateCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  StickyNote,
  Tag,
  Trash2,
  TriangleAlert,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { Segmented } from "../../components/tools/segmented";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Select } from "../../components/tools/select";
import { ToolShell } from "../../components/tools/tool-shell";
import { downloadBlob, downloadText } from "../../lib/download";
import {
  generateMindmap,
  type MindmapOperation,
  type MindmapTemplate,
} from "../../lib/api";
import { loadLLMConfig } from "../../lib/llm-config";
import { meta } from "./meta";
import {
  colorInputValue,
  DEFAULT_THEME_ID,
  filterOutline,
  flattenNodes,
  getThemePreset,
  THEME_PRESETS,
  isSafeHyperlink,
  isSafeMindMapData,
  mergeNodeStyle,
  parseIcons,
  parseTags,
  toMarkdown,
  toPlainText,
  type DirectionId,
  type ThemePresetId,
} from "./lib";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

const directionOptions = [
  { value: "right" as DirectionId, label: "右向" },
  { value: "left" as DirectionId, label: "左向" },
  { value: "side" as DirectionId, label: "双侧" },
  { value: "down" as DirectionId, label: "上下" },
] as const;

const iconOptions = [
  { value: "⭐", label: "重点", Icon: Star },
  { value: "✅", label: "完成", Icon: Check },
  { value: "💡", label: "想法", Icon: Lightbulb },
  { value: "🔥", label: "重要", Icon: Flame },
  { value: "📌", label: "固定", Icon: Pin },
  { value: "🚀", label: "计划", Icon: Rocket },
  { value: "⚠️", label: "警告", Icon: TriangleAlert },
  { value: "❓", label: "问题", Icon: CircleHelp },
] as const;
const themeOptions = [
  { value: "latte", label: "奶油浅色" },
  { value: "ocean", label: "海洋蓝·圆角卡片" },
  { value: "forest", label: "森林绿" },
  { value: "dark", label: "深色夜间" },
  { value: "contrast", label: "高对比度" },
  { value: "square", label: "方形卡片" },
];

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

function directionForInstance(instance: MindElixirInstance, direction: DirectionId) {
  if (direction === "left") instance.initLeft();
  else if (direction === "side") instance.initSide();
  else if (direction === "down") instance.initDown();
  else instance.initRight();
}

function directionFromNumber(value: number | undefined): DirectionId {
  if (value === 0) return "left";
  if (value === 2) return "side";
  if (value === 3) return "down";
  return "right";
}

function nodeFromRoot(root: NodeObj | undefined, id: string | undefined): NodeObj | undefined {
  if (!root || !id) return undefined;
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = nodeFromRoot(child, id);
    if (found) return found;
  }
  return undefined;
}

function ancestorIds(root: NodeObj | undefined, id: string, path: string[] = []): string[] | undefined {
  if (!root) return undefined;
  const nextPath = [...path, root.id];
  if (root.id === id) return nextPath;
  for (const child of root.children ?? []) {
    const found = ancestorIds(child, id, nextPath);
    if (found) return found;
  }
  return undefined;
}

export default function MindmapUi() {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MindElixirInstance | null>(null);
  const detachBusRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(false);
  const themeIdRef = useRef<ThemePresetId>(DEFAULT_THEME_ID);
  const inputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<MindElixirData | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [themeId, setThemeId] = useState<ThemePresetId>(DEFAULT_THEME_ID);
  const [direction, setDirection] = useState<DirectionId>("right");
  const [compact, setCompact] = useState(false);
  const [query, setQuery] = useState("");
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiOperation, setAiOperation] = useState<MindmapOperation>("replace");
  const [aiTemplate, setAiTemplate] = useState<MindmapTemplate>("project-plan");
  const [aiDirection, setAiDirection] = useState<DirectionId>("right");
  const [aiCompact, setAiCompact] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPreview, setAiPreview] = useState<MindElixirData | null>(null);
  const [aiPreviewCount, setAiPreviewCount] = useState(0);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiUndoSnapshotRef = useRef<MindElixirData | null>(null);
  const aiRedoSnapshotRef = useRef<MindElixirData | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [iconsDraft, setIconsDraft] = useState("");

  const selectedId = selectedIds[selectedIds.length - 1];
  const selectedNode = useMemo(
    () => nodeFromRoot(snapshot?.nodeData, selectedId),
    [selectedId, snapshot?.nodeData],
  );
  const outline = useMemo(
    () => filterOutline(snapshot ? flattenNodes(snapshot.nodeData) : [], query),
    [query, snapshot],
  );

  useEffect(() => {
    themeIdRef.current = themeId;
  }, [themeId]);

  const syncSnapshot = useCallback((instance: MindElixirInstance) => {
    const data = instance.getData();
    setSnapshot(data);
    setDirection(directionFromNumber(data.direction ?? instance.direction));
    setCompact(Boolean(data.compact ?? instance.compact));
  }, []);

  const setDraftsForNode = useCallback((node?: NodeObj) => {
    setNoteDraft(node?.note ?? "");
    setLinkDraft(node?.hyperLink ?? "");
    setTagsDraft(
      (node?.tags ?? [])
        .map((tag) => (typeof tag === "string" ? tag : tag.text))
        .join(", "),
    );
    setIconsDraft((node?.icons ?? []).join(" "));
  }, []);

  const attachBus = useCallback(
    (instance: MindElixirInstance) => {
      const sync = () => syncSnapshot(instance);
      const onSelect = (nodes: NodeObj[]) => {
        setSelectedIds(nodes.map((node) => node.id));
        setDraftsForNode(nodes[nodes.length - 1]);
        sync();
      };
      const onUnselect = (nodes: NodeObj[]) => {
        const ids = new Set(nodes.map((node) => node.id));
        setSelectedIds((current) => current.filter((id) => !ids.has(id)));
        sync();
      };
      const onNewNode = (node: NodeObj) => {
        setSelectedIds([node.id]);
        setDraftsForNode(node);
        sync();
      };
      const onDirection = (value: number) => {
        setDirection(directionFromNumber(value));
        sync();
      };
      const bus = instance.bus;
      bus.addListener("operation", sync);
      bus.addListener("selectNodes", onSelect);
      bus.addListener("unselectNodes", onUnselect);
      bus.addListener("selectNewNode", onNewNode);
      bus.addListener("changeDirection", onDirection);
      detachBusRef.current = () => {
        if (!instance.bus) {
          detachBusRef.current = null;
          return;
        }
        bus.removeListener("operation", sync);
        bus.removeListener("selectNodes", onSelect);
        bus.removeListener("unselectNodes", onUnselect);
        bus.removeListener("selectNewNode", onNewNode);
        bus.removeListener("changeDirection", onDirection);
        detachBusRef.current = null;
      };
    },
    [setDraftsForNode, syncSnapshot],
  );

  const mountMindmap = useCallback(
    async (data?: MindElixirData) => {
      const { default: MindElixir } = await import("mind-elixir");
      if (!mountedRef.current || !containerRef.current) return;

      detachBusRef.current?.();
      instanceRef.current?.destroy();
      const importedTheme = data?.theme;
      const importedPresetId = THEME_PRESETS.find(
        (preset) => preset.theme.name === importedTheme?.name,
      )?.id ?? themeIdRef.current;
      const importedPreset = getThemePreset(importedPresetId);
      const theme: Theme = importedTheme ?? importedPreset.theme;
      const initialData = data ?? {
        ...MindElixir.new("中心主题"),
        direction: MindElixir.RIGHT as 0 | 1 | 2 | 3,
        theme,
        compact: false,
        meta: { mindmapTheme: importedPreset.id },
      };
      const instance = new MindElixir({
        el: containerRef.current,
        direction: initialData.direction ?? MindElixir.RIGHT,
        editable: true,
        contextMenu: true,
        toolBar: false,
        keypress: true,
        allowUndo: true,
        mouseSelectionButton: 0,
        compact: Boolean(initialData.compact),
        theme,
        mobileMultiSelect: true,
      });
      instance.init(initialData);
      instanceRef.current = instance;
      attachBus(instance);
      const nextThemeId = THEME_PRESETS.find(
        (preset) => preset.theme.name === theme.name,
      )?.id;
      if (nextThemeId) {
        themeIdRef.current = nextThemeId;
        setThemeId(nextThemeId);
      }
      setSelectedIds([]);
      syncSnapshot(instance);
      setReady(true);
      setError("");
    },
    [attachBus, syncSnapshot],
  );

  useEffect(() => {
    mountedRef.current = true;
    void mountMindmap().catch((cause) => {
      if (mountedRef.current) setError(cause instanceof Error ? cause.message : "思维导图加载失败。");
    });
    return () => {
      mountedRef.current = false;
      aiAbortRef.current?.abort();
      detachBusRef.current?.();
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [mountMindmap]);

  const runNodeAction = (
    action: (instance: MindElixirInstance, node: NonNullable<MindElixirInstance["currentNode"]>) => Promise<void> | void,
  ) => {
    const instance = instanceRef.current;
    const node = instance?.currentNode;
    if (!instance || !node) {
      setError("请先点击选择一个节点。你也可以双击节点直接编辑。");
      return;
    }
    setError("");
    void Promise.resolve(action(instance, node)).catch((cause) => {
      setError(cause instanceof Error ? cause.message : "节点操作失败。");
    });
  };

  const addChild = () => runNodeAction((instance, node) => instance.addChild(node));
  const addSibling = () => runNodeAction((instance, node) => instance.insertSibling("after", node));
  const addParent = () => runNodeAction((instance, node) => instance.insertParent(node));
  const editNode = () => runNodeAction((instance, node) => instance.beginEdit(node));
  const moveUp = () => runNodeAction((instance, node) => instance.moveUpNode(node));
  const moveDown = () => runNodeAction((instance, node) => instance.moveDownNode(node));

  const removeNode = () => {
    const instance = instanceRef.current;
    const nodes = instance?.currentNodes ?? [];
    if (!instance || nodes.length === 0) {
      setError("请先点击选择一个节点。");
      return;
    }
    if (nodes.some((node) => node.nodeObj.id === instance.nodeData.id)) {
      setError("根节点不能删除，请删除它的子节点或新建导图。");
      return;
    }
    setError("");
    void instance.removeNodes(nodes).catch((cause) => {
      setError(cause instanceof Error ? cause.message : "删除节点失败。");
    });
  };

  const toggleExpanded = (expand?: boolean) => {
    runNodeAction((instance, selectedTopic) => {
      let node = selectedTopic;
      try {
        node = instance.findEle(selectedTopic.nodeObj.id);
      } catch {
        setError("当前节点已不在画布中，请重新选择后再操作。");
        return;
      }

      if (!node.nodeObj.children?.length) {
        setError("当前节点没有子节点可折叠或展开。");
        return;
      }
      if (node.nodeObj.id === instance.nodeData.id) {
        setError("根节点不支持折叠或展开。");
        return;
      }

      const expander = node.parentNode?.children?.[1];
      if (!expander || expander.tagName !== "ME-EPD") {
        setError("当前节点的折叠控件不可用，请重新选择节点。");
        return;
      }

      const isExpanded = node.nodeObj.expanded !== false;
      const next = expand ?? !isExpanded;
      if (next === isExpanded) return;

      instance.expandNode(node, next);
      syncSnapshot(instance);
    });
  };

  const undo = () => {
    const instance = instanceRef.current;
    if (!instance) return;
    if (aiUndoSnapshotRef.current) {
      aiRedoSnapshotRef.current = instance.getData();
      const previous = aiUndoSnapshotRef.current;
      aiUndoSnapshotRef.current = null;
      instance.refresh(previous);
      syncSnapshot(instance);
    } else {
      instance.undo();
    }
    setError("");
  };
  const redo = () => {
    const instance = instanceRef.current;
    if (!instance) return;
    if (aiRedoSnapshotRef.current) {
      aiUndoSnapshotRef.current = instance.getData();
      const next = aiRedoSnapshotRef.current;
      aiRedoSnapshotRef.current = null;
      instance.refresh(next);
      syncSnapshot(instance);
    } else {
      instance.redo();
    }
    setError("");
  };
  const fitCanvas = () => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.scaleFit();
    instance.toCenter();
    setError("");
  };

  const applyNodePatch = (patch: Partial<NodeObj>) => {
    runNodeAction((instance, node) => instance.reshapeNode(node, patch));
  };

  const applyStyle = (style: Partial<NonNullable<NodeObj["style"]>>) => {
    const node = selectedNode;
    if (!node) {
      setError("请先选择要设置样式的节点。");
      return;
    }
    applyNodePatch({ style: mergeNodeStyle(node, style).style });
  };

  const saveDetails = () => {
    if (!selectedNode) {
      setError("请先选择一个节点，再编辑备注和标签。");
      return;
    }
    if (!isSafeHyperlink(linkDraft.trim())) {
      setError("链接仅支持 http、https 或 mailto 地址。");
      return;
    }
    applyNodePatch({
      note: noteDraft.trim() || undefined,
      hyperLink: linkDraft.trim() || undefined,
      tags: parseTags(tagsDraft),
      icons: parseIcons(iconsDraft),
    });
  };

  const toggleIcon = (icon: string) => {
    const icons = parseIcons(iconsDraft);
    const next = icons.includes(icon) ? icons.filter((item) => item !== icon) : [...icons, icon];
    setIconsDraft(next.join(" "));
  };

  const changeTheme = (value: string) => {
    const id = value as ThemePresetId;
    const instance = instanceRef.current;
    if (!instance) return;
    const preset = getThemePreset(id);
    themeIdRef.current = id;
    setThemeId(id);
    instance.changeTheme(preset.theme, true);
    syncSnapshot(instance);
  };

  const changeDirection = (value: DirectionId) => {
    const instance = instanceRef.current;
    if (!instance) return;
    directionForInstance(instance, value);
    setDirection(value);
    syncSnapshot(instance);
  };

  const changeCompact = (value: boolean) => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.changeCompact(value);
    setCompact(value);
    syncSnapshot(instance);
  };

  const focusOutline = (id: string) => {
    const instance = instanceRef.current;
    if (!instance) return;
    try {
      const path = ancestorIds(instance.nodeData, id) ?? ancestorIds(snapshot?.nodeData, id);
      if (!path) {
        setError("无法定位这个节点，它可能已经被删除或不在当前视图中。");
        return;
      }

      let needsRefresh = false;
      path.slice(0, -1).forEach((ancestorId) => {
        const ancestor = nodeFromRoot(instance.nodeData, ancestorId);
        if (ancestor?.children?.length && ancestor.expanded === false) {
          ancestor.expanded = true;
          needsRefresh = true;
        }
      });
      if (needsRefresh) instance.refresh();

      let topic: NonNullable<MindElixirInstance["currentNode"]>;
      try {
        topic = instance.findEle(id);
      } catch {
        setError("无法定位这个节点，它可能已经被删除或不在当前视图中。");
        return;
      }
      instance.selectNode(topic);
      instance.scrollIntoView(topic, true);
      setSelectedIds([id]);
      syncSnapshot(instance);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法定位这个节点。");
    }
  };

  const exportJson = () => {
    const instance = instanceRef.current;
    if (!instance) return;
    downloadText(instance.getDataString(), "思维导图.mindmap.json", "application/json;charset=utf-8");
  };
  const exportOutline = (format: "markdown" | "text") => {
    if (!snapshot) return;
    const content = format === "markdown" ? toMarkdown(snapshot.nodeData) : toPlainText(snapshot.nodeData);
    downloadText(content, `思维导图.${format === "markdown" ? "md" : "txt"}`, "text/plain;charset=utf-8");
  };
  const exportImage = async (format: "svg" | "png") => {
    const instance = instanceRef.current;
    if (!instance) return;
    try {
      const blob = format === "svg" ? instance.exportSvg() : await instance.exportPng();
      if (blob) downloadBlob(blob, `思维导图.${format}`);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "导出失败。");
    }
  };

  const resetMindmap = async () => {
    setReady(false);
    setSelectedIds([]);
    await mountMindmap();
  };

  const importMindmap = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("文件过大，请选择 10 MB 以内的思维导图快照。");
      return;
    }
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!isSafeMindMapData(data)) throw new Error("文件不是有效或安全的思维导图快照。");
      setReady(false);
      await mountMindmap(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取思维导图快照。");
      setReady(Boolean(instanceRef.current));
    }
  };

  const applyAiPreview = () => {
    const instance = instanceRef.current;
    if (!instance || !aiPreview || !isSafeMindMapData(aiPreview)) {
      setAiError("没有可应用的安全预览结果。");
      return;
    }
    aiUndoSnapshotRef.current = instance.getData();
    aiRedoSnapshotRef.current = null;
    instance.refresh(aiPreview);
    syncSnapshot(instance);
    setSelectedIds([]);
    setAiPreview(null);
    setAiError("");
    setAiOpen(false);
  };

  const openAiAssistant = () => {
    setAiDirection(direction);
    setAiCompact(compact);
    setAiError("");
    setAiOpen(true);
  };

  const cancelAiGeneration = () => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAiBusy(false);
  };

  const generateWithAi = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) {
      setAiError("请先描述你想绘制或修改的内容。");
      return;
    }
    const config = loadLLMConfig();
    if (!config?.provider || !config.model || !config.api_key) {
      setAiError("请先在系统设置中配置 provider、模型和 API Key。");
      return;
    }
    if (aiOperation === "append" && !selectedNode) {
      setAiError("追加操作需要先在画布中选中一个节点。");
      return;
    }
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiBusy(true);
    setAiError("");
    setAiPreview(null);
    try {
      const response = await generateMindmap(
        {
          prompt,
          operation: aiOperation,
          template: aiTemplate,
          direction: aiDirection,
          compact: aiCompact,
          selected_node_id: aiOperation === "append" ? selectedNode?.id : undefined,
          current_data: aiOperation === "replace" ? undefined : snapshot,
          provider: config.provider,
          model: config.model,
          api_key: config.api_key,
        },
        controller.signal,
      );
      if (!isSafeMindMapData(response.data)) {
        throw new Error("模型返回的导图未通过安全校验。");
      }
      setAiPreview(response.data);
      setAiPreviewCount(response.node_count);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setAiError(cause instanceof Error ? cause.message : "AI 生成失败，请稍后重试。");
    } finally {
      if (aiAbortRef.current === controller) {
        aiAbortRef.current = null;
        setAiBusy(false);
      }
    }
  };

  const style = selectedNode?.style;
  const disabled = !ready;

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local wide>
      <div className="flex h-[calc(100dvh-13rem)] min-h-[560px] flex-col gap-2.5">
        <input ref={inputRef} type="file" accept=".json,application/json" onChange={importMindmap} className="sr-only" />
        <div className="flex flex-wrap items-center gap-1.5 border border-border bg-background px-2 py-2">
          <span className="px-1 text-xs font-semibold text-muted-foreground">文件</span>
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled} aria-label="导入思维导图快照"><FileUp className="h-3.5 w-3.5" />导入</Button>
          <Button variant="outline" size="sm" onClick={exportJson} disabled={disabled} aria-label="导出 JSON"><FileDown className="h-3.5 w-3.5" />JSON</Button>
          <Button variant="outline" size="sm" onClick={() => exportOutline("markdown")} disabled={disabled} aria-label="导出 Markdown 大纲"><FileText className="h-3.5 w-3.5" />Markdown</Button>
          <Button variant="outline" size="sm" onClick={() => exportOutline("text")} disabled={disabled} aria-label="导出纯文本大纲"><FileOutput className="h-3.5 w-3.5" />文本</Button>
          <Button variant="outline" size="sm" onClick={() => void exportImage("svg")} disabled={disabled}>SVG</Button>
          <Button variant="outline" size="sm" onClick={() => void exportImage("png")} disabled={disabled}>PNG</Button>
          <Button variant="outline" size="sm" onClick={() => void resetMindmap()} disabled={disabled}><RotateCcw className="h-3.5 w-3.5" />新建</Button>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <span className="px-1 text-xs font-semibold text-muted-foreground">编辑</span>
          <Button variant="outline" size="sm" onClick={undo} disabled={disabled} aria-label="撤销"><Undo2 className="h-3.5 w-3.5" />撤销</Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={disabled} aria-label="重做"><Redo2 className="h-3.5 w-3.5" />重做</Button>
          <Button variant="outline" size="sm" onClick={fitCanvas} disabled={disabled}><LocateFixed className="h-3.5 w-3.5" />适应画布</Button>
          <Button variant="primary" size="sm" onClick={openAiAssistant} disabled={disabled}><Sparkles className="h-3.5 w-3.5" />AI 助手</Button>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" />
          <span className="px-1 text-xs font-semibold text-muted-foreground">结构</span>
          <Button variant="outline" size="sm" onClick={addChild} disabled={disabled}><Plus className="h-3.5 w-3.5" />子节点</Button>
          <Button variant="outline" size="sm" onClick={addSibling} disabled={disabled}><GitBranch className="h-3.5 w-3.5" />同级</Button>
          <Button variant="outline" size="sm" onClick={addParent} disabled={disabled}><Plus className="h-3.5 w-3.5" />父节点</Button>
          <Button variant="outline" size="sm" onClick={editNode} disabled={disabled}><Pencil className="h-3.5 w-3.5" />编辑主题</Button>
          <Button variant="outline" size="sm" onClick={moveUp} disabled={disabled} aria-label="节点上移"><MoveUp className="h-3.5 w-3.5" />上移</Button>
          <Button variant="outline" size="sm" onClick={moveDown} disabled={disabled} aria-label="节点下移"><MoveDown className="h-3.5 w-3.5" />下移</Button>
          <Button variant="outline" size="sm" onClick={() => toggleExpanded(false)} disabled={disabled}><FoldVertical className="h-3.5 w-3.5" />折叠</Button>
          <Button variant="outline" size="sm" onClick={() => toggleExpanded(true)} disabled={disabled}><Expand className="h-3.5 w-3.5" />展开</Button>
          <Button variant="destructive" size="sm" onClick={removeNode} disabled={disabled}><Trash2 className="h-3.5 w-3.5" />删除</Button>
          <span className="mx-1 hidden h-5 w-px bg-border xl:block" />
          <Button variant="outline" size="sm" onClick={() => setLeftPanelOpen((open) => !open)} className="xl:hidden" aria-expanded={leftPanelOpen}><PanelLeft className="h-3.5 w-3.5" />外观</Button>
          <Button variant="outline" size="sm" onClick={() => setRightPanelOpen((open) => !open)} className="xl:hidden" aria-expanded={rightPanelOpen}><PanelRight className="h-3.5 w-3.5" />检查</Button>
          <span className="ml-auto px-1 text-[11px] text-muted-foreground">{ready ? "本地处理 · 多选用于结构重排 · 不自动保存" : "正在加载思维导图…"}</span>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <div className="mindmap-editor relative min-h-0 flex-1 overflow-hidden border border-border bg-background">
          <div className="grid h-full min-h-0 xl:grid-cols-[200px_minmax(0,1fr)_280px]">
          <aside className={`z-20 min-h-0 overflow-y-auto border-r border-border bg-background p-3 xl:relative xl:z-auto xl:block xl:overflow-y-auto xl:shadow-none ${leftPanelOpen ? "absolute inset-y-0 left-0 block w-[min(19rem,calc(100%-1rem))] shadow-xl" : "hidden"}`}>
            <div className="mb-3 flex items-center justify-between xl:hidden">
              <span className="text-sm font-semibold">画布与外观</span>
              <Button variant="ghost" size="sm" onClick={() => setLeftPanelOpen(false)} aria-label="关闭画布与外观面板"><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold"><Paintbrush className="h-4 w-4" />画布与节点</div>
                <Select value={themeId} onChange={changeTheme} options={themeOptions} ariaLabel="选择主题和节点外观" />
                <div className="flex flex-wrap gap-1.5" aria-label="主题预览">
                  {themeOptions.map((option) => {
                    const preset = getThemePreset(option.value);
                    return <button key={option.value} type="button" onClick={() => changeTheme(option.value)} aria-label={`使用${option.label}`} aria-pressed={themeId === option.value} className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors ${themeId === option.value ? "border-ring bg-accent text-foreground" : "border-border text-muted-foreground hover:bg-muted"}`}><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: preset.theme.palette[0] }} />{option.label}</button>;
                  })}
                </div>
              </section>
              <section className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Layout className="h-4 w-4" />布局</div>
                <Segmented value={direction} onChange={changeDirection} options={directionOptions} className="grid w-full grid-cols-2" />
                <Button variant={compact ? "primary" : "outline"} size="sm" onClick={() => changeCompact(!compact)} className="w-full"><Columns2 className="h-3.5 w-3.5" />{compact ? "紧凑间距：已开启" : "紧凑间距：已关闭"}</Button>
              </section>
            </div>
          </aside>
          <div ref={containerRef} aria-label="思维导图画布，可拖拽并框选节点" className="mindmap-canvas min-h-0 min-w-0 bg-background" />
          <aside className={`z-20 min-h-0 overflow-y-auto border-l border-border bg-background p-3 xl:relative xl:z-auto xl:block xl:overflow-y-auto xl:shadow-none ${rightPanelOpen ? "absolute inset-y-0 right-0 block w-[min(22rem,calc(100%-1rem))] shadow-xl" : "hidden"}`}>
            <div className="mb-3 flex items-center justify-between xl:hidden">
              <span className="text-sm font-semibold">节点检查器</span>
              <Button variant="ghost" size="sm" onClick={() => setRightPanelOpen(false)} aria-label="关闭节点检查器"><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <section className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><PanelRight className="h-4 w-4" />节点样式</div>
                {selectedNode ? <>
                  <p className="truncate text-xs text-muted-foreground">正在编辑：{selectedNode.topic}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-muted-foreground">文字颜色<input type="color" value={colorInputValue(style?.color, "#1e293b")} onChange={(event) => applyStyle({ color: event.target.value })} className="mt-1 h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1" /></label>
                    <label className="text-xs text-muted-foreground">背景颜色<input type="color" value={colorInputValue(style?.background, "#ffffff")} onChange={(event) => applyStyle({ background: event.target.value })} className="mt-1 h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1" /></label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={style?.fontSize ?? "16px"} onChange={(value) => applyStyle({ fontSize: value })} options={["14px", "16px", "18px", "20px", "24px", "28px"].map((value) => ({ value, label: value }))} ariaLabel="节点字号" />
                    <Select value={style?.width ?? "auto"} onChange={(value) => applyStyle({ width: value === "auto" ? undefined : value })} options={[{ value: "auto", label: "自动宽度" }, { value: "120px", label: "窄卡片" }, { value: "180px", label: "标准卡片" }, { value: "240px", label: "宽卡片" }]} ariaLabel="节点宽度" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant={style?.fontWeight === "bold" ? "primary" : "outline"} size="sm" onClick={() => applyStyle({ fontWeight: style?.fontWeight === "bold" ? "normal" : "bold" })} aria-label="切换粗体"><Bold className="h-3.5 w-3.5" />粗体</Button>
                    <Button variant={style?.textDecoration === "underline" ? "primary" : "outline"} size="sm" onClick={() => applyStyle({ textDecoration: style?.textDecoration === "underline" ? "none" : "underline" })} aria-label="切换下划线"><Underline className="h-3.5 w-3.5" />下划线</Button>
                  </div>
                  <Select value={style?.border ?? "none"} onChange={(value) => applyStyle({ border: value === "none" ? undefined : value })} options={[{ value: "none", label: "无边框" }, { value: "1px solid #94a3b8", label: "细边框" }, { value: "2px solid #2563eb", label: "强调边框" }]} ariaLabel="节点边框" />
                  <label className="text-xs text-muted-foreground">分支颜色<input type="color" value={colorInputValue(selectedNode.branchColor, "#2563eb")} onChange={(event) => applyNodePatch({ branchColor: event.target.value })} className="mt-1 h-9 w-full cursor-pointer rounded-md border border-input bg-background p-1" /></label>
                </> : <p className="rounded-lg bg-muted/50 px-3 py-3 text-xs text-muted-foreground">选择一个节点后，可以修改颜色、字号、边框和宽度。圆角、方形和高对比度外观可在上方主题中切换。</p>}
              </section>

              <section className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><StickyNote className="h-4 w-4" />备注与链接</div>
                {selectedNode ? <>
                  <TextArea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="记录这个节点的补充说明…" rows={3} mono={false} maxLength={5000} />
                  <TextField value={linkDraft} onChange={(event) => setLinkDraft(event.target.value)} placeholder="https://example.com" type="url" maxLength={2000} />
                  <div className="flex items-center gap-2"><Link2 className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="text-xs text-muted-foreground">仅保存安全的 http、https 或 mailto 链接</span></div>
                </> : <p className="text-xs text-muted-foreground">选择节点后添加备注和超链接。</p>}
              </section>

              <section className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Tag className="h-4 w-4" />标签与图标</div>
                {selectedNode ? <>
                  <TextField value={tagsDraft} onChange={(event) => setTagsDraft(event.target.value)} placeholder="标签，用逗号分隔" maxLength={800} />
                  <TextField value={iconsDraft} onChange={(event) => setIconsDraft(event.target.value)} placeholder="节点标记，用空格分隔" maxLength={120} />
                  <div className="flex flex-wrap gap-1.5">{iconOptions.map(({ value, label, Icon }) => <Button key={value} variant={parseIcons(iconsDraft).includes(value) ? "primary" : "outline"} size="sm" onClick={() => toggleIcon(value)} aria-label={`添加${label}标记`} title={label}><Icon className="h-3.5 w-3.5" /></Button>)}</div>
                  <Button variant="primary" size="sm" onClick={saveDetails} className="w-full">保存备注、链接和标签</Button>
                </> : <p className="text-xs text-muted-foreground">选择节点后添加标签或节点标记。</p>}
              </section>

              <section className="space-y-2 border-t border-border pt-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Search className="h-4 w-4" />搜索与大纲</div>
                <TextField value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索主题、备注或标签" aria-label="搜索思维导图" />
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                  {outline.length > 0 ? outline.map(({ node, depth, path }) => <button key={node.id} type="button" onClick={() => focusOutline(node.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted" style={{ paddingLeft: `${8 + depth * 14}px` }}><span className="shrink-0 text-[10px] text-muted-foreground">{path}</span><span className="truncate">{node.topic}</span></button>) : <p className="px-2 py-3 text-xs text-muted-foreground">没有匹配的节点。</p>}
                </div>
              </section>
            </div>
          </aside>
          </div>
        </div>
        {aiOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !aiBusy) setAiOpen(false);
            }}
          >
            <section
              className="flex max-h-[min(780px,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="mindmap-ai-title"
            >
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-brand" />
                  <div>
                    <h2 id="mindmap-ai-title" className="text-sm font-semibold">AI 思维导图助手</h2>
                    <p className="text-xs text-muted-foreground">自然语言生成，先预览再应用</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setAiOpen(false)} disabled={aiBusy} aria-label="关闭 AI 助手"><X className="h-4 w-4" /></Button>
              </header>

              <div className="min-h-0 space-y-4 overflow-y-auto p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select value={aiOperation} onChange={(value) => { setAiOperation(value as MindmapOperation); setAiPreview(null); }} options={aiOperationOptions} ariaLabel="选择 AI 操作" />
                  <Select value={aiTemplate} onChange={(value) => { setAiTemplate(value as MindmapTemplate); setAiPreview(null); }} options={aiTemplateOptions.map(({ value, label }) => ({ value, label }))} ariaLabel="选择思维导图模板" />
                </div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {aiTemplateOptions.find(({ value }) => value === aiTemplate)?.description}
                  {aiOperation === "append" && <span className="ml-2 font-medium text-foreground">{selectedNode ? `当前追加到：${selectedNode.topic}` : "请先选中一个节点"}</span>}
                  {aiOperation !== "replace" && <span className="ml-2">当前导图内容会发送给已配置的模型。</span>}
                </div>
                <TextArea
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder={aiOperation === "append" ? "例如：补充验收标准、风险和负责人…" : "例如：绘制一个网站发布计划，包含阶段、任务、负责人和风险…"}
                  rows={5}
                  mono={false}
                  maxLength={8000}
                  aria-label="描述要生成的思维导图"
                />
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Segmented value={aiDirection} onChange={(value) => setAiDirection(value as DirectionId)} options={directionOptions} className="grid grid-cols-2" />
                  <Button variant={aiCompact ? "primary" : "outline"} size="sm" onClick={() => setAiCompact((value) => !value)}><Columns2 className="h-3.5 w-3.5" />{aiCompact ? "紧凑" : "宽松"}</Button>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  <span>模型只返回受限的节点结构。API Key 复用系统设置中的本地配置，不会写入导图或 URL；应用前可取消。</span>
                </div>
                {aiError && <ErrorBox>{aiError}</ErrorBox>}

                {aiPreview && (
                  <div className="space-y-2 rounded-lg border border-brand/40 bg-brand/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4" />生成预览</div>
                      <span className="text-xs text-muted-foreground">{aiPreviewCount} 个节点</span>
                    </div>
                    <div className="max-h-44 overflow-y-auto rounded-md border border-border bg-background p-2">
                      {flattenNodes(aiPreview.nodeData).slice(0, 30).map(({ node, depth, path }) => (
                        <div key={node.id} className="flex gap-2 py-1 text-xs" style={{ paddingLeft: `${depth * 14}px` }}>
                          <span className="shrink-0 text-muted-foreground">{path}</span>
                          <span className="truncate">{node.topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
                {aiBusy ? (
                  <Button variant="outline" size="sm" onClick={cancelAiGeneration}><X className="h-3.5 w-3.5" />取消生成</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setAiPreview(null)} disabled={!aiPreview}><RotateCw className="h-3.5 w-3.5" />清除预览</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => void generateWithAi()} disabled={aiBusy || !aiPrompt.trim()}><Send className="h-3.5 w-3.5" />{aiPreview ? "重新生成" : "生成预览"}</Button>
                <Button variant="primary" size="sm" onClick={applyAiPreview} disabled={aiBusy || !aiPreview}><Check className="h-3.5 w-3.5" />应用到画布</Button>
              </footer>
            </section>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
