export const MAX_DATABASE_BYTES = 50 * 1024 * 1024;
export const MAX_QUERY_LENGTH = 20_000;
export const MAX_RESULT_ROWS = 1_000;
export const MAX_RESULT_BYTES = 2 * 1024 * 1024;
export const MAX_RESULT_COLUMNS = 200;
export const MAX_CELL_CHARS = 10_000;
export const MAX_TABLES = 200;

export type SqlCell = string | number | null;

export type SqlQueryResult = {
  columns: string[];
  rows: SqlCell[][];
  truncated: boolean;
};

export type DatabaseTable = {
  name: string;
  type: "table" | "view";
  schema: string | null;
};

export type SqliteWorkerRequest =
  | { id: number; type: "open"; bytes: ArrayBuffer }
  | { id: number; type: "query"; sql: string }
  | { id: number; type: "table"; table: string }
  | { id: number; type: "close" };

export type SqliteWorkerResponse =
  | { id: number; type: "opened"; tables: DatabaseTable[] }
  | { id: number; type: "result"; result: SqlQueryResult }
  | { id: number; type: "closed" }
  | { id: number; type: "error"; message: string };

export function isSqliteFile(file: File): boolean {
  return /\.(?:db|db3|sqlite|sqlite3)$/iu.test(file.name) ||
    /(?:sqlite|x-sqlite3)/iu.test(file.type);
}

export function validateDatabaseFile(file: File): string | null {
  if (!file.size) return "数据库文件为空。";
  if (file.size > MAX_DATABASE_BYTES) return "SQLite 数据库文件不能超过 50 MB。";
  return null;
}

/**
 * 仅允许一个 SELECT 语句。扫描器会忽略字符串和 SQL 注释中的分号，
 * 但拒绝任何第二条语句及所有非 SELECT 起始命令。
 */
export function getSelectQueryError(source: string): string | null {
  if (!source.trim()) return "请输入 SELECT 查询。";
  if (source.length > MAX_QUERY_LENGTH) return "查询不能超过 20,000 个字符。";

  let index = skipIgnored(source, 0);
  const first = source.slice(index).match(/^([A-Za-z]+)/u)?.[1]?.toUpperCase();
  if (first !== "SELECT") return "为保护本地数据库，只允许执行单条 SELECT 查询。";

  let quote: "single" | "double" | "backtick" | "bracket" | null = null;
  for (; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (quote === "single") {
      if (character === "'" && next === "'") index += 1;
      else if (character === "'") quote = null;
      continue;
    }
    if (quote === "double") {
      if (character === '"' && next === '"') index += 1;
      else if (character === '"') quote = null;
      continue;
    }
    if (quote === "backtick") {
      if (character === "`") quote = null;
      continue;
    }
    if (quote === "bracket") {
      if (character === "]") quote = null;
      continue;
    }
    if (character === "'") {
      quote = "single";
      continue;
    }
    if (character === '"') {
      quote = "double";
      continue;
    }
    if (character === "`") {
      quote = "backtick";
      continue;
    }
    if (character === "[") {
      quote = "bracket";
      continue;
    }
    if (character === "-" && next === "-") {
      index = skipLineComment(source, index + 2) - 1;
      continue;
    }
    if (character === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) return "SQL 注释没有闭合。";
      index = end + 1;
      continue;
    }
    if (character === ";") {
      const after = skipIgnored(source, index + 1);
      if (after < source.length) return "为保护本地数据库，只允许执行单条 SELECT 查询。";
      return null;
    }
  }
  return quote ? "SQL 字符串或标识符没有闭合。" : null;
}

export function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export function createCsv(result: SqlQueryResult): string {
  return [result.columns, ...result.rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

function csvCell(value: SqlCell): string {
  if (value === null) return "";
  const text = String(value);
  const safeText = /^[=+\-@\t\r]/u.test(text) ? `'${text}` : text;
  return /[",\r\n]/u.test(safeText) ? `"${safeText.replaceAll('"', '""')}"` : safeText;
}

function skipIgnored(source: string, start: number): number {
  let index = start;
  while (index < source.length) {
    if (/\s/u.test(source[index])) {
      index += 1;
      continue;
    }
    if (source[index] === "-" && source[index + 1] === "-") {
      index = skipLineComment(source, index + 2) - 1;
      continue;
    }
    if (source[index] === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      if (end < 0) return source.length;
      index = end + 2;
      continue;
    }
    break;
  }
  return index;
}

function skipLineComment(source: string, start: number): number {
  const end = source.indexOf("\n", start);
  return end < 0 ? source.length : end + 1;
}
