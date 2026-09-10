import {
  MAX_CELL_CHARS,
  MAX_RESULT_BYTES,
  MAX_RESULT_COLUMNS,
  MAX_RESULT_ROWS,
  MAX_TABLES,
  getSelectQueryError,
  quoteIdentifier,
} from "./lib";

const scope = globalThis;
let database = null;
let runtimePromise = null;

scope.onmessage = (event) => {
  void handleRequest(event.data);
};

async function handleRequest(request) {
  try {
    if (request.type === "open") {
      closeDatabase();
      const runtime = await loadRuntime();
      database = new runtime.Database(new Uint8Array(request.bytes));
      scope.postMessage({ id: request.id, type: "opened", tables: listTables(database) });
      return;
    }
    if (request.type === "close") {
      closeDatabase();
      scope.postMessage({ id: request.id, type: "closed" });
      return;
    }

    const activeDatabase = requireDatabase();
    if (request.type === "table") {
      const table = listTables(activeDatabase).find((item) => item.name === request.table);
      if (!table) throw new Error("找不到所选数据表或视图。");
      scope.postMessage({
        id: request.id,
        type: "result",
        result: executeQuery(activeDatabase, `SELECT * FROM ${quoteIdentifier(table.name)} LIMIT ${MAX_RESULT_ROWS}`),
      });
      return;
    }

    const queryError = getSelectQueryError(request.sql);
    if (queryError) throw new Error(queryError);
    scope.postMessage({ id: request.id, type: "result", result: executeQuery(activeDatabase, request.sql) });
  } catch (error) {
    scope.postMessage({ id: request.id, type: "error", message: errorMessage(error) });
  }
}

async function loadRuntime() {
  runtimePromise ??= (async () => {
    const [{ default: initSqlJs }, { default: wasmUrl }] = await Promise.all([
      import("sql.js"),
      import("sql.js/dist/sql-wasm.wasm", { with: { turbopackModuleType: "asset" } }),
    ]);
    const response = await fetch(wasmUrl);
    if (!response.ok) throw new Error(`无法加载 SQLite WASM 运行时（${response.status}）。`);
    const wasmBinary = await response.arrayBuffer();
    return initSqlJs({ wasmBinary });
  })();
  return runtimePromise;
}

function listTables(activeDatabase) {
  const [result] = activeDatabase.exec(
    "SELECT name, type, sql FROM sqlite_master WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%' ORDER BY name LIMIT 200",
  );
  if (!result) return [];
  return result.values.slice(0, MAX_TABLES).flatMap((row) => {
    const [name, type, schema] = row;
    if (typeof name !== "string" || (type !== "table" && type !== "view")) return [];
    return [{
      name,
      type,
      schema: typeof schema === "string" ? truncateCell(schema) : null,
    }];
  });
}

function executeQuery(activeDatabase, sql) {
  const statement = activeDatabase.prepare(sql);
  try {
    const columns = statement.getColumnNames();
    if (!columns.length) throw new Error("查询没有返回列。请使用 SELECT 查询。");
    if (columns.length > MAX_RESULT_COLUMNS) {
      throw new Error(`结果列数不能超过 ${MAX_RESULT_COLUMNS} 列。请缩小 SELECT 字段范围。`);
    }

    const rows = [];
    let bytes = utf8Bytes(columns.join(","));
    let truncated = false;
    while (statement.step()) {
      if (rows.length >= MAX_RESULT_ROWS) {
        truncated = true;
        break;
      }
      const row = statement.get().map(normalizeCell);
      const rowBytes = utf8Bytes(JSON.stringify(row));
      if (bytes + rowBytes > MAX_RESULT_BYTES) {
        truncated = true;
        break;
      }
      bytes += rowBytes;
      rows.push(row);
    }
    return { columns, rows, truncated };
  } finally {
    statement.free();
  }
}

function normalizeCell(value) {
  if (value === null || typeof value === "number") return value;
  if (typeof value === "string") return truncateCell(value);
  return `BLOB (${value.byteLength.toLocaleString("en-US")} bytes)`;
}

function truncateCell(value) {
  return value.length > MAX_CELL_CHARS ? `${value.slice(0, MAX_CELL_CHARS)}…（已截断）` : value;
}

function utf8Bytes(value) {
  return new TextEncoder().encode(value).byteLength;
}

function requireDatabase() {
  if (!database) throw new Error("请先打开 SQLite 数据库文件。");
  return database;
}

function closeDatabase() {
  if (!database) return;
  try {
    database.close();
  } finally {
    database = null;
  }
}

function errorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}
