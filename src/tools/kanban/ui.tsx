"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  FileDown,
  FileUp,
  GripVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { Select } from "../../components/tools/select";
import { TextArea, TextField } from "../../components/tools/inputs";
import { ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import { meta } from "./meta";
import {
  MAX_BOARD_TITLE_LENGTH,
  MAX_CARD_DESCRIPTION_LENGTH,
  MAX_CARD_TITLE_LENGTH,
  MAX_COLUMNS,
  MAX_IMPORT_BYTES,
  MAX_COLUMN_TITLE_LENGTH,
  addCard,
  addColumn,
  createInitialBoard,
  moveCard,
  moveCardBy,
  parseBoardSnapshot,
  removeCard,
  removeColumn,
  updateBoardTitle,
  updateCard,
  updateColumnTitle,
  validateBoard,
  type KanbanBoard,
} from "./lib";

const DROP_ZONE_HEIGHT = "h-2";

type DropTarget = {
  columnId: string;
  index: number;
};

export default function KanbanUi() {
  const [board, setBoard] = useState<KanbanBoard>(createInitialBoard);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const validationError = validateBoard(board);

  function updateBoardState(updater: (current: KanbanBoard) => KanbanBoard) {
    setBoard(updater);
    setError("");
  }

  function announce(message: string) {
    setAnnouncement("");
    window.requestAnimationFrame(() => setAnnouncement(message));
  }

  function resetBoard() {
    if (!window.confirm("确定新建看板吗？当前未导出的内容会被清除。")) return;
    updateBoardState(() => createInitialBoard());
    announce("已新建项目看板。");
  }

  function exportBoard() {
    if (validationError) {
      setError(validationError);
      return;
    }
    downloadText(
      JSON.stringify(board, null, 2),
      "项目看板.kanban.json",
      "application/json;charset=utf-8",
    );
    announce("已导出项目看板 JSON 快照。");
  }

  async function importBoard(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setError("文件过大，请选择 5 MB 以内的项目看板快照。");
      return;
    }

    try {
      const snapshot = parseBoardSnapshot(JSON.parse(await file.text()));
      setBoard(snapshot);
      setError("");
      announce("已导入项目看板快照。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法读取项目看板快照。");
    }
  }

  function addNewColumn() {
    if (board.columns.length >= MAX_COLUMNS) return;
    updateBoardState((current) => addColumn(current));
    announce("已添加新列。");
  }

  function deleteColumn(columnId: string, title: string, cardCount: number) {
    if (board.columns.length <= 1) return;
    if (
      cardCount > 0 &&
      !window.confirm(`删除“${title}”后，其中的 ${cardCount} 张卡片会移到相邻列。继续吗？`)
    ) return;
    updateBoardState((current) => removeColumn(current, columnId));
    announce(`已删除列“${title}”。`);
  }

  function handleDrop(columnId: string, index: number, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!draggedCardId) return;
    updateBoardState((current) => moveCard(current, draggedCardId, columnId, index));
    setDraggedCardId(null);
    setDropTarget(null);
    announce("已移动卡片。");
  }

  function beginDrag(cardId: string, event: DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", cardId);
    setDraggedCardId(cardId);
  }

  function moveCardToColumn(cardId: string, currentColumnId: string, targetColumnId: string) {
    if (currentColumnId === targetColumnId) return;
    const target = board.columns.find((column) => column.id === targetColumnId);
    if (!target) return;
    updateBoardState((current) => moveCard(current, cardId, targetColumnId, target.cards.length));
    announce(`已将卡片移动到“${target.title}”。`);
  }

  return (
    <ToolShell
      icon={meta.icon}
      title={meta.name}
      description={meta.description}
      local
      wide
    >
      <div className="flex h-[calc(100dvh-13rem)] min-h-[460px] flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
          <label className="sr-only" htmlFor="kanban-title">
            看板标题
          </label>
          <TextField
            id="kanban-title"
            value={board.title}
            maxLength={MAX_BOARD_TITLE_LENGTH}
            aria-invalid={Boolean(!board.title.trim() || board.title.length > MAX_BOARD_TITLE_LENGTH)}
            aria-label="看板标题"
            onChange={(event) => updateBoardState((current) => updateBoardTitle(current, event.target.value))}
            className="h-8 w-44 bg-background px-2.5 py-1 text-xs font-semibold"
          />
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            onChange={importBoard}
            className="sr-only"
          />
          <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-3.5 w-3.5" />
            导入 JSON
          </Button>
          <Button variant="outline" size="sm" onClick={exportBoard} disabled={Boolean(validationError)}>
            <FileDown className="h-3.5 w-3.5" />
            导出 JSON
          </Button>
          <Button variant="outline" size="sm" onClick={resetBoard}>
            <X className="h-3.5 w-3.5" />
            新建看板
          </Button>
          <Button variant="outline" size="sm" onClick={addNewColumn} disabled={board.columns.length >= MAX_COLUMNS}>
            <Plus className="h-3.5 w-3.5" />
            添加列
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            本地处理 · 不自动保存
          </span>
        </div>

        {(error || validationError) && <ErrorBox>{error || validationError}</ErrorBox>}
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        <div
          className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-muted/20 p-3"
          role="list"
          aria-label="项目看板列"
        >
          <div className="flex min-h-full min-w-max items-start gap-3">
            {board.columns.map((column, columnIndex) => (
              <section
                key={column.id}
                role="listitem"
                aria-labelledby={`kanban-column-${column.id}`}
                className="flex w-[min(84vw,24rem)] min-w-[18rem] shrink-0 flex-col rounded-xl border border-border bg-card shadow-sm"
              >
                <div className="flex items-center gap-2 border-b border-border p-3">
                  <label className="sr-only" htmlFor={`kanban-column-${column.id}`}>
                    列标题
                  </label>
                  <TextField
                    id={`kanban-column-${column.id}`}
                    value={column.title}
                    maxLength={MAX_COLUMN_TITLE_LENGTH}
                    aria-invalid={Boolean(!column.title.trim() || column.title.length > MAX_COLUMN_TITLE_LENGTH)}
                    onChange={(event) =>
                      updateBoardState((current) => updateColumnTitle(current, column.id, event.target.value))
                    }
                    className="h-8 min-w-0 flex-1 bg-background px-2.5 py-1 text-sm font-semibold"
                  />
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                    {column.cards.length}
                  </span>
                  <button
                    type="button"
                    aria-label={`删除列 ${column.title}`}
                    title="删除列"
                    disabled={board.columns.length <= 1}
                    onClick={() => deleteColumn(column.id, column.title, column.cards.length)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div
                  className="flex min-h-[18rem] flex-1 flex-col gap-1.5 p-2"
                  role="list"
                  aria-label={`${column.title}中的卡片`}
                >
                  {column.cards.map((card, cardIndex) => (
                    <div key={`slot-${card.id}`}>
                      <DropSlot
                        active={dropTarget?.columnId === column.id && dropTarget.index === cardIndex}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "move";
                          setDropTarget({ columnId: column.id, index: cardIndex });
                        }}
                        onDrop={(event) => handleDrop(column.id, cardIndex, event)}
                      />
                      <article
                        draggable
                        role="listitem"
                        onDragStart={(event) => beginDrag(card.id, event)}
                        onDragEnd={() => {
                          setDraggedCardId(null);
                          setDropTarget(null);
                        }}
                        className={`rounded-lg border border-border bg-background p-2.5 shadow-sm transition-opacity ${
                          draggedCardId === card.id ? "opacity-40" : ""
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical
                            aria-hidden="true"
                            className="mt-1 h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                          />
                          <label className="sr-only" htmlFor={`kanban-card-title-${card.id}`}>
                            卡片标题
                          </label>
                          <TextField
                            id={`kanban-card-title-${card.id}`}
                            value={card.title}
                            maxLength={MAX_CARD_TITLE_LENGTH}
                            aria-invalid={Boolean(!card.title.trim() || card.title.length > MAX_CARD_TITLE_LENGTH)}
                            onChange={(event) =>
                              updateBoardState((current) =>
                                updateCard(current, column.id, card.id, { title: event.target.value }),
                              )
                            }
                            className="h-8 min-w-0 flex-1 bg-card px-2 py-1 text-sm font-medium"
                          />
                          <button
                            type="button"
                            aria-label={`删除卡片 ${card.title}`}
                            title="删除卡片"
                            onClick={() => {
                              updateBoardState((current) => removeCard(current, column.id, card.id));
                              announce("已删除卡片。");
                            }}
                            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <label className="sr-only" htmlFor={`kanban-card-description-${card.id}`}>
                          卡片描述
                        </label>
                        <TextArea
                          id={`kanban-card-description-${card.id}`}
                          value={card.description}
                          maxLength={MAX_CARD_DESCRIPTION_LENGTH}
                          aria-invalid={card.description.length > MAX_CARD_DESCRIPTION_LENGTH}
                          onChange={(event) =>
                            updateBoardState((current) =>
                              updateCard(current, column.id, card.id, { description: event.target.value }),
                            )
                          }
                          rows={3}
                          mono={false}
                          placeholder="添加描述…"
                          className="mt-2 resize-y bg-card text-xs leading-5"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-border pt-2">
                          <CardAction
                            label="向上移动"
                            disabled={cardIndex === 0}
                            onClick={() => {
                              updateBoardState((current) => moveCardBy(current, column.id, card.id, -1));
                              announce("已向上移动卡片。");
                            }}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </CardAction>
                          <CardAction
                            label="向下移动"
                            disabled={cardIndex === column.cards.length - 1}
                            onClick={() => {
                              updateBoardState((current) => moveCardBy(current, column.id, card.id, 1));
                              announce("已向下移动卡片。");
                            }}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </CardAction>
                          <CardAction
                            label="移到上一列"
                            disabled={columnIndex === 0}
                            onClick={() =>
                              moveCardToColumn(card.id, column.id, board.columns[columnIndex - 1].id)
                            }
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </CardAction>
                          <CardAction
                            label="移到下一列"
                            disabled={columnIndex === board.columns.length - 1}
                            onClick={() =>
                              moveCardToColumn(card.id, column.id, board.columns[columnIndex + 1].id)
                            }
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </CardAction>
                          <Select
                            value={column.id}
                            onChange={(targetColumnId) =>
                              moveCardToColumn(card.id, column.id, targetColumnId)
                            }
                            options={board.columns.map((item) => ({ value: item.id, label: item.title }))}
                            ariaLabel="移动卡片到列"
                            className="ml-auto min-w-28 max-w-full"
                          />
                        </div>
                      </article>
                    </div>
                  ))}
                  <DropSlot
                    active={dropTarget?.columnId === column.id && dropTarget.index === column.cards.length}
                    empty={column.cards.length === 0}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDropTarget({ columnId: column.id, index: column.cards.length });
                    }}
                    onDrop={(event) => handleDrop(column.id, column.cards.length, event)}
                  />
                </div>

                <div className="border-t border-border p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => {
                      updateBoardState((current) => addCard(current, column.id, { title: "新卡片" }));
                      announce(`已在“${column.title}”添加卡片。`);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    添加卡片
                  </Button>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}

function DropSlot({
  active,
  empty = false,
  onDragOver,
  onDrop,
}: {
  active: boolean;
  empty?: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      aria-hidden="true"
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`${empty ? "min-h-32" : DROP_ZONE_HEIGHT} rounded-md border border-dashed transition-colors ${
        active
          ? "border-brand bg-brand/10"
          : "border-transparent"
      }`}
    >
      {empty && active && (
        <span className="flex h-full items-center justify-center text-xs text-brand">
          放置卡片到这里
        </span>
      )}
    </div>
  );
}

function CardAction({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
