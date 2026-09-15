"use client";

import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  getBezierPath,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnConnect,
  type OnInit,
  type OnMoveEnd,
  type ReactFlowInstance,
  type Viewport,
} from "@xyflow/react";
import { Edit3, Link2, StickyNote } from "lucide-react";
import type { CSSProperties, MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useRef } from "react";
import type { NodeObj, Theme } from "mind-elixir";
import type { MindMapGraph, MindMapGraphEdge, MindMapGraphNode } from "./lib";

export type MindMapCanvasNodeData = {
  label: string;
  node: NodeObj;
  isRoot?: boolean;
  editing?: boolean;
  onBeginEdit: (id: string) => void;
  onCommitEdit: (id: string, value: string) => void;
  onCancelEdit: () => void;
};

export type MindMapCanvasNode = Node<MindMapCanvasNodeData, "mindmap">;

export type MindMapCanvasEdgeData = {
  kind?: "hierarchy" | "relationship";
  label?: string;
  bidirectional?: boolean;
  branchColor?: string;
  style?: {
    stroke?: string;
    strokeWidth?: string | number;
    strokeDasharray?: string;
    opacity?: string | number;
    labelColor?: string;
  };
};

export type MindMapCanvasEdge = Edge<MindMapCanvasEdgeData>;

export type MindMapCanvasProps = {
  graph: MindMapGraph;
  selectedIds: string[];
  editingId: string | null;
  onBeginEdit: (id: string) => void;
  onCommitEdit: (id: string, value: string) => void;
  onCancelEdit: () => void;
  onNodesChange: (changes: NodeChange<MindMapCanvasNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<MindMapCanvasEdge>[]) => void;
  onNodeDragStop: (event: MouseEvent | TouchEvent, node: MindMapCanvasNode, nodes: MindMapCanvasNode[]) => void;
  onNodeClick: (event: ReactMouseEvent, node: MindMapCanvasNode) => void;
  onEdgeClick?: (event: ReactMouseEvent, edge: MindMapCanvasEdge) => void;
  onPaneClick: () => void;
  onConnect?: OnConnect;
  onMoveEnd?: OnMoveEnd;
  defaultViewport?: Viewport;
  theme?: Theme;
  onInit?: OnInit<MindMapCanvasNode, MindMapCanvasEdge>;
  className?: string;
};

function tagsForNode(node: NodeObj): string[] {
  return (node.tags ?? []).map((tag) => (typeof tag === "string" ? tag : tag.text)).filter(Boolean).slice(0, 3);
}

function MindMapNode({ id, data, selected }: NodeProps<MindMapCanvasNode>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tags = tagsForNode(data.node);

  useEffect(() => {
    if (data.editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [data.editing]);

  const submit = () => {
    const value = inputRef.current?.value.trim() ?? "";
    if (value) data.onCommitEdit(id, value);
  };

  const style = data.node.style;
  const rootClass = data.isRoot
    ? "mindmap-flow-node mindmap-flow-node-root"
    : "mindmap-flow-node";

  return (
    <div
      className={`${rootClass} group ${selected ? "is-selected" : ""}`}
      style={{
        color: style?.color,
        background: style?.background,
        fontSize: style?.fontSize,
        fontWeight: style?.fontWeight,
        border: style?.border,
        textDecoration: style?.textDecoration,
        width: style?.width === "auto" ? undefined : style?.width,
        borderColor: data.node.branchColor,
      }}
      onDoubleClick={(event) => {
        event.stopPropagation();
        data.onBeginEdit(id);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !data.editing) {
          event.preventDefault();
          data.onBeginEdit(id);
        }
      }}
      tabIndex={0}
      aria-label={`节点：${data.label}`}
    >
      <Handle type="target" position={Position.Left} id="target" aria-label="连接目标" />
      <Handle type="source" position={Position.Right} id="source" aria-label="连接源" />
      <div className="flex items-start gap-2">
        {data.node.icons && data.node.icons.length > 0 && <span className="shrink-0 text-sm">{data.node.icons.slice(0, 2).join(" ")}</span>}
        {data.editing ? (
          <input
            ref={inputRef}
            defaultValue={data.label}
            onBlur={submit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                data.onCancelEdit();
              }
            }}
            className="nodrag nowheel min-w-0 flex-1 rounded border border-ring bg-background px-1.5 py-0.5 text-inherit outline-none"
            maxLength={1000}
            aria-label="编辑节点主题"
          />
        ) : (
          <span className="min-w-0 flex-1 break-words leading-5">{data.label}</span>
        )}
        {!data.editing && <Edit3 className="nodrag mt-0.5 h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" aria-hidden />}
      </div>
      {data.node.note && (
        <div className="mt-2 flex items-start gap-1.5 border-t border-current/10 pt-1.5 text-[11px] font-normal opacity-65">
          <StickyNote className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          <span className="line-clamp-2">{data.node.note}</span>
        </div>
      )}
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => <span key={tag} className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-normal opacity-75">{tag}</span>)}
        </div>
      )}
    </div>
  );
}

function MindMapEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }: EdgeProps<MindMapCanvasEdge>) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const relationship = data?.kind === "relationship";
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerStart={relationship && data?.bidirectional ? MarkerType.ArrowClosed : undefined}
        markerEnd={relationship ? MarkerType.ArrowClosed : undefined}
        style={{ stroke: relationship ? data?.style?.stroke ?? "var(--brand)" : data?.branchColor ?? "var(--muted-foreground)", strokeWidth: data?.style?.strokeWidth ?? (relationship ? 1.8 : 1.5), strokeDasharray: data?.style?.strokeDasharray ?? (relationship ? "6 4" : undefined), opacity: data?.style?.opacity }}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <span className="nodrag nopan pointer-events-none absolute rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground shadow-sm" style={{ color: data?.style?.labelColor, transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}>{data.label}</span>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = { mindmap: MindMapNode };
const edgeTypes = { mindmap: MindMapEdge };

export function graphToCanvas(
  graph: MindMapGraph,
  rootId: string,
  callbacks: Pick<MindMapCanvasNodeData, "onBeginEdit" | "onCommitEdit" | "onCancelEdit">,
  editingId: string | null,
): { nodes: MindMapCanvasNode[]; edges: MindMapCanvasEdge[] } {
  return {
    nodes: graph.nodes.map((item: MindMapGraphNode) => ({
      id: item.id,
      type: "mindmap",
      position: item.position,
      data: {
        label: item.data.label,
        node: item.data.node,
        isRoot: item.id === rootId,
        editing: item.id === editingId,
        ...callbacks,
      },
      draggable: true,
      selectable: true,
      focusable: true,
    })),
    edges: graph.edges.map((item: MindMapGraphEdge) => ({
      id: item.id,
      source: item.source,
      target: item.target,
      type: "mindmap",
      data: item.data,
      reconnectable: true,
    })),
  };
}

export function MindMapCanvas({
  graph,
  selectedIds,
  editingId,
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onNodesChange,
  onEdgesChange,
  onNodeDragStop,
  onNodeClick,
  onEdgeClick,
  onPaneClick,
  onConnect,
  onMoveEnd,
  defaultViewport,
  theme,
  onInit,
  className,
}: MindMapCanvasProps) {
  const rootId = graph.nodes.find((item) => !graph.edges.some((edge) => edge.target === item.id))?.id ?? graph.nodes[0]?.id ?? "";
  const { nodes, edges } = graphToCanvas(graph, rootId, { onBeginEdit, onCommitEdit, onCancelEdit }, editingId);
  const selected = new Set(selectedIds);
  const selectedNodes = nodes.map((node) => ({ ...node, selected: selected.has(node.id) }));

  return (
    <div
      className={`mindmap-flow relative h-full w-full ${className ?? ""}`}
      style={{
        "--mindmap-node-bg": theme?.cssVar?.["--bgcolor"],
        "--mindmap-node-color": theme?.cssVar?.["--color"],
        "--mindmap-node-border": theme?.cssVar?.["--main-border"],
        "--mindmap-root-bg": theme?.cssVar?.["--root-bgcolor"],
        "--mindmap-root-color": theme?.cssVar?.["--root-color"],
      } as CSSProperties}
    >
      <ReactFlow
        nodes={selectedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onInit={onInit}
        defaultViewport={defaultViewport}
        fitView={!defaultViewport}
        fitViewOptions={{ padding: 0.24, maxZoom: 1.1 }}
        minZoom={0.1}
        maxZoom={3}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectionOnDrag
        panOnDrag
        panOnScroll
        selectionKeyCode="Shift"
        multiSelectionKeyCode={["Meta", "Control"]}
        deleteKeyCode={["Backspace", "Delete"]}
        onlyRenderVisibleElements={false}
        proOptions={{ hideAttribution: false }}
        defaultEdgeOptions={{ type: "mindmap" }}
        connectionLineStyle={{ stroke: "var(--brand)", strokeWidth: 2 }}
        aria-label="思维导图自由画布"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.1} />
        <Controls showInteractive={false} aria-label="画布缩放控制" />
        <MiniMap pannable zoomable nodeColor="var(--brand)" maskColor="color-mix(in oklch, var(--background) 72%, transparent)" aria-label="思维导图小地图" />
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-card/85 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur-md">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          拖动节点自由摆放 · 双击编辑 · Shift 框选
        </div>
      </ReactFlow>
    </div>
  );
}

export type { ReactFlowInstance };
export type { Connection };
