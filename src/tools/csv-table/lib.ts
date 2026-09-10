export const MAX_TABLE_INPUT = 5 * 1024 * 1024;
export const MAX_TABLE_ROWS = 5_000;
export const MAX_TABLE_COLUMNS = 100;

export function detectDelimiter(input: string): "comma" | "tab" {
  const firstLine = input.split(/\r?\n/u, 1)[0] ?? "";
  return firstLine.includes("\t") && !firstLine.includes(",") ? "tab" : "comma";
}

export function parseDelimited(input: string, delimiter: "comma" | "tab"): string[][] {
  if (input.length > MAX_TABLE_INPUT) throw new Error("表格输入不能超过 5 MB");
  const separator = delimiter === "tab" ? "\t" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === separator) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
    if (rows.length > MAX_TABLE_ROWS) throw new Error(`最多支持 ${MAX_TABLE_ROWS.toLocaleString("zh-CN")} 行`);
  }

  if (quoted) throw new Error("表格引号未闭合");
  if (field || row.length) {
    row.push(field);
    if (row.some((value) => value !== "")) rows.push(row);
  }
  const columns = Math.max(0, ...rows.map((values) => values.length));
  if (columns > MAX_TABLE_COLUMNS) throw new Error(`最多支持 ${MAX_TABLE_COLUMNS} 列`);
  return rows.map((values) => [...values, ...Array(columns - values.length).fill("")]);
}

export function toDelimited(rows: readonly (readonly string[])[], delimiter: "comma" | "tab"): string {
  const separator = delimiter === "tab" ? "\t" : ",";
  return rows
    .map((row) => row.map((value) => {
      const text = String(value ?? "");
      return /["\r\n\t,]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
    }).join(separator))
    .join("\n");
}
