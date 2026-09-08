export type ConvertMode = "json-csv" | "csv-json" | "json-xml" | "xml-json";

function asRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    if (!value.every((item) => item && typeof item === "object" && !Array.isArray(item))) throw new Error("JSON → CSV 需要对象数组，例如 [{\"name\": \"Ada\"}]");
    return value as Record<string, unknown>[];
  }
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  throw new Error("JSON → CSV 需要对象或对象数组");
}

function csvEscape(value: unknown): string {
  const raw = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export function jsonToCsv(input: string): string {
  const rows = asRows(JSON.parse(input));
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [headers.map(csvEscape).join(","), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(","))].join("\n");
}

/** RFC 4180-compatible enough for files exported by spreadsheets: quoted fields, escaped quotes, CRLF. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quote = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote) {
      if (ch === '"' && input[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quote = false;
      else field += ch;
    } else if (ch === '"') quote = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      if (row.some((v) => v !== "")) rows.push(row);
      row = []; field = "";
    } else field += ch;
  }
  if (quote) throw new Error("CSV 引号未闭合");
  row.push(field);
  if (row.some((v) => v !== "")) rows.push(row);
  return rows;
}

function inferScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "") return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(trimmed)) return Number(trimmed);
  return value;
}

export function csvToJson(input: string): string {
  const rows = parseCsv(input);
  if (rows.length < 1) return "[]";
  const [headers, ...body] = rows;
  if (!headers.every((h) => h.trim())) throw new Error("CSV 首行必须包含列名");
  const output = body.map((row) => Object.fromEntries(headers.map((header, i) => [header, inferScalar(row[i] ?? "")])));
  return JSON.stringify(output, null, 2);
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function xmlName(name: string): string {
  return /^[A-Za-z_][\w.-]*$/.test(name) ? name : "item";
}

function toXml(value: unknown, name: string, depth: number): string {
  const tag = xmlName(name);
  const pad = "  ".repeat(depth);
  if (value === null || value === undefined) return `${pad}<${tag}/>`;
  if (Array.isArray(value)) return value.map((item) => toXml(item, tag, depth)).join("\n");
  if (typeof value === "object") {
    const children = Object.entries(value as Record<string, unknown>).map(([key, item]) => toXml(item, key, depth + 1)).join("\n");
    return children ? `${pad}<${tag}>\n${children}\n${pad}</${tag}>` : `${pad}<${tag}/>`;
  }
  return `${pad}<${tag}>${xmlEscape(String(value))}</${tag}>`;
}

export function jsonToXml(input: string, rootName = "root"): string {
  const value = JSON.parse(input) as unknown;
  const content = Array.isArray(value)
    ? value.map((item) => toXml(item, "item", 1)).join("\n")
    : toXml(value, rootName, 0);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${Array.isArray(value) ? `<${xmlName(rootName)}>\n${content}\n</${xmlName(rootName)}>` : content}`;
}

function elementValue(el: Element): unknown {
  const children = Array.from(el.children);
  const attrs = Array.from(el.attributes);
  if (!children.length && !attrs.length) return inferScalar(el.textContent?.trim() ?? "");
  const result: Record<string, unknown> = {};
  for (const attr of attrs) result[`@${attr.name}`] = attr.value;
  for (const child of children) {
    const value = elementValue(child);
    const current = result[child.tagName];
    result[child.tagName] = current === undefined ? value : Array.isArray(current) ? [...current, value] : [current, value];
  }
  const text = el.childNodes.length === 1 ? "" : Array.from(el.childNodes).filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent?.trim()).filter(Boolean).join(" ");
  if (text) result["#text"] = text;
  return result;
}

export function xmlToJson(input: string): string {
  const doc = new DOMParser().parseFromString(input, "application/xml");
  const error = doc.querySelector("parsererror");
  if (error) throw new Error("XML 格式无效");
  const root = doc.documentElement;
  return JSON.stringify({ [root.tagName]: elementValue(root) }, null, 2);
}

export function convert(input: string, mode: ConvertMode, rootName?: string): string {
  if (!input.trim()) return "";
  switch (mode) {
    case "json-csv": return jsonToCsv(input);
    case "csv-json": return csvToJson(input);
    case "json-xml": return jsonToXml(input, rootName);
    case "xml-json": return xmlToJson(input);
  }
}
