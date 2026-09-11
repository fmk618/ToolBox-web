import { newId } from "../../lib/id";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_COLUMNS = 12;
export const MAX_CARDS = 500;
export const MAX_ID_LENGTH = 128;
export const MAX_BOARD_TITLE_LENGTH = 100;
export const MAX_COLUMN_TITLE_LENGTH = 80;
export const MAX_CARD_TITLE_LENGTH = 160;
export const MAX_CARD_DESCRIPTION_LENGTH = 2_000;

export type KanbanCard = {
  id: string;
  title: string;
  description: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

export type KanbanBoard = {
  version: 1;
  title: string;
  columns: KanbanColumn[];
};

export function createInitialBoard(): KanbanBoard {
  return {
    version: 1,
    title: "我的项目",
    columns: [
      { id: newId(), title: "待办", cards: [] },
      { id: newId(), title: "进行中", cards: [] },
      { id: newId(), title: "已完成", cards: [] },
    ],
  };
}

export function updateBoardTitle(board: KanbanBoard, title: string): KanbanBoard {
  return { ...board, title };
}

export function updateColumnTitle(
  board: KanbanBoard,
  columnId: string,
  title: string,
): KanbanBoard {
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, title } : column,
    ),
  };
}

export function addColumn(board: KanbanBoard, title = "新列"): KanbanBoard {
  if (board.columns.length >= MAX_COLUMNS) return board;
  return {
    ...board,
    columns: [...board.columns, { id: newId(), title, cards: [] }],
  };
}

export function removeColumn(board: KanbanBoard, columnId: string): KanbanBoard {
  if (board.columns.length <= 1) return board;
  const index = board.columns.findIndex((column) => column.id === columnId);
  if (index < 0) return board;

  const targetIndex = index > 0 ? index - 1 : 1;
  const targetId = board.columns[targetIndex].id;
  const removed = board.columns[index];
  return {
    ...board,
    columns: board.columns
      .filter((column) => column.id !== columnId)
      .map((column) =>
        column.id === targetId
          ? { ...column, cards: [...column.cards, ...removed.cards] }
          : column,
      ),
  };
}

export function addCard(
  board: KanbanBoard,
  columnId: string,
  card: Partial<Pick<KanbanCard, "title" | "description">> = {},
): KanbanBoard {
  if (board.columns.reduce((count, column) => count + column.cards.length, 0) >= MAX_CARDS) {
    return board;
  }
  const id = newId();
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? {
            ...column,
            cards: [
              ...column.cards,
              { id, title: card.title ?? "新卡片", description: card.description ?? "" },
            ],
          }
        : column,
    ),
  };
}

export function updateCard(
  board: KanbanBoard,
  columnId: string,
  cardId: string,
  patch: Partial<Pick<KanbanCard, "title" | "description">>,
): KanbanBoard {
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? {
            ...column,
            cards: column.cards.map((card) =>
              card.id === cardId ? { ...card, ...patch } : card,
            ),
          }
        : column,
    ),
  };
}

export function removeCard(
  board: KanbanBoard,
  columnId: string,
  cardId: string,
): KanbanBoard {
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId
        ? { ...column, cards: column.cards.filter((card) => card.id !== cardId) }
        : column,
    ),
  };
}

export function moveCard(
  board: KanbanBoard,
  cardId: string,
  targetColumnId: string,
  targetIndex: number,
): KanbanBoard {
  let sourceColumnId: string | null = null;
  let movingCard: KanbanCard | null = null;
  for (const column of board.columns) {
    const card = column.cards.find((item) => item.id === cardId);
    if (card) {
      sourceColumnId = column.id;
      movingCard = card;
      break;
    }
  }
  if (!sourceColumnId || !movingCard) return board;

  const targetColumn = board.columns.find((column) => column.id === targetColumnId);
  if (!targetColumn) return board;

  const sourceCards = board.columns.find((column) => column.id === sourceColumnId)!.cards;
  const remainingSourceCards = sourceCards.filter((card) => card.id !== cardId);
  const targetCards =
    sourceColumnId === targetColumnId
      ? remainingSourceCards
      : targetColumn.cards;
  const insertAt = Math.max(0, Math.min(targetIndex, targetCards.length));
  const nextTargetCards = [
    ...targetCards.slice(0, insertAt),
    movingCard,
    ...targetCards.slice(insertAt),
  ];

  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id === sourceColumnId && column.id === targetColumnId) {
        return { ...column, cards: nextTargetCards };
      }
      if (column.id === sourceColumnId) return { ...column, cards: remainingSourceCards };
      if (column.id === targetColumnId) return { ...column, cards: nextTargetCards };
      return column;
    }),
  };
}

export function moveCardBy(
  board: KanbanBoard,
  columnId: string,
  cardId: string,
  direction: -1 | 1,
): KanbanBoard {
  const column = board.columns.find((item) => item.id === columnId);
  if (!column) return board;
  const index = column.cards.findIndex((card) => card.id === cardId);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= column.cards.length) return board;
  return moveCard(board, cardId, columnId, targetIndex);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readId(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > MAX_ID_LENGTH) {
    throw new Error(`${field}必须是非空且不超过 ${MAX_ID_LENGTH} 个字符的文本。`);
  }
  return value;
}

function readTitle(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(`${field}必须非空且不超过 ${maxLength} 个字符。`);
  }
  return value.trim();
}

function readDescription(value: unknown): string {
  if (typeof value !== "string" || value.length > MAX_CARD_DESCRIPTION_LENGTH) {
    throw new Error(`卡片描述不能超过 ${MAX_CARD_DESCRIPTION_LENGTH} 个字符。`);
  }
  return value;
}

export function validateBoard(board: KanbanBoard): string | null {
  if (board.version !== 1) return "看板版本无效。";
  if (board.title.trim().length === 0) return "看板标题不能为空。";
  if (board.title.length > MAX_BOARD_TITLE_LENGTH) {
    return `看板标题不能超过 ${MAX_BOARD_TITLE_LENGTH} 个字符。`;
  }
  if (board.columns.length < 1 || board.columns.length > MAX_COLUMNS) {
    return `看板需要有 1 至 ${MAX_COLUMNS} 个列。`;
  }

  const ids = new Set<string>();
  let cardCount = 0;
  for (const column of board.columns) {
    if (!column.id || column.id.length > MAX_ID_LENGTH || ids.has(column.id)) {
      return "看板包含无效或重复的列 ID。";
    }
    ids.add(column.id);
    if (!column.title.trim() || column.title.length > MAX_COLUMN_TITLE_LENGTH) {
      return `列标题不能为空且不能超过 ${MAX_COLUMN_TITLE_LENGTH} 个字符。`;
    }
    for (const card of column.cards) {
      cardCount += 1;
      if (cardCount > MAX_CARDS) return `看板最多支持 ${MAX_CARDS} 张卡片。`;
      if (!card.id || card.id.length > MAX_ID_LENGTH || ids.has(card.id)) {
        return "看板包含无效或重复的卡片 ID。";
      }
      ids.add(card.id);
      if (!card.title.trim() || card.title.length > MAX_CARD_TITLE_LENGTH) {
        return `卡片标题不能为空且不能超过 ${MAX_CARD_TITLE_LENGTH} 个字符。`;
      }
      if (card.description.length > MAX_CARD_DESCRIPTION_LENGTH) {
        return `卡片描述不能超过 ${MAX_CARD_DESCRIPTION_LENGTH} 个字符。`;
      }
    }
  }
  return null;
}

export function parseBoardSnapshot(value: unknown): KanbanBoard {
  if (!isRecord(value) || value.version !== 1) throw new Error("文件不是有效的项目看板快照。");
  const title = readTitle(value.title, "看板标题", MAX_BOARD_TITLE_LENGTH);
  if (!Array.isArray(value.columns) || value.columns.length < 1 || value.columns.length > MAX_COLUMNS) {
    throw new Error(`看板需要有 1 至 ${MAX_COLUMNS} 个列。`);
  }

  const ids = new Set<string>();
  let cardCount = 0;
  const columns = value.columns.map((rawColumn, columnIndex) => {
    if (!isRecord(rawColumn)) throw new Error(`第 ${columnIndex + 1} 个列格式无效。`);
    const id = readId(rawColumn.id, `第 ${columnIndex + 1} 个列的 ID`);
    if (ids.has(id)) throw new Error("看板包含重复的 ID。");
    ids.add(id);
    const columnTitle = readTitle(
      rawColumn.title,
      `第 ${columnIndex + 1} 个列标题`,
      MAX_COLUMN_TITLE_LENGTH,
    );
    if (!Array.isArray(rawColumn.cards)) throw new Error(`列“${columnTitle}”的卡片数据无效。`);
    const cards = rawColumn.cards.map((rawCard, cardIndex) => {
      if (!isRecord(rawCard)) throw new Error(`列“${columnTitle}”的第 ${cardIndex + 1} 张卡片无效。`);
      cardCount += 1;
      if (cardCount > MAX_CARDS) throw new Error(`看板最多支持 ${MAX_CARDS} 张卡片。`);
      const cardId = readId(rawCard.id, `列“${columnTitle}”的卡片 ID`);
      if (ids.has(cardId)) throw new Error("看板包含重复的 ID。");
      ids.add(cardId);
      return {
        id: cardId,
        title: readTitle(
          rawCard.title,
          `列“${columnTitle}”的卡片标题`,
          MAX_CARD_TITLE_LENGTH,
        ),
        description: readDescription(rawCard.description),
      };
    });
    return { id, title: columnTitle, cards };
  });

  return { version: 1, title, columns };
}
