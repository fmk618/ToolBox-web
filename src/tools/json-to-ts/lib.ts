export type TypeOptions = {
  rootName: string;
  optionalFields: boolean;
  readonly: boolean;
};

type Node =
  | { kind: "null" }
  | { kind: "primitive"; name: "string" | "number" | "boolean" }
  | { kind: "array"; item: Node }
  | { kind: "object"; fields: Map<string, { node: Node; count: number }>; count: number }
  | { kind: "union"; nodes: Node[] };

function primitive(value: unknown): Node {
  if (value === null) return { kind: "null" };
  if (Array.isArray(value)) return array(value);
  if (typeof value === "object") return object(value as Record<string, unknown>);
  return { kind: "primitive", name: typeof value as "string" | "number" | "boolean" };
}

function object(value: Record<string, unknown>): Node {
  const fields = new Map<string, { node: Node; count: number }>();
  for (const [key, val] of Object.entries(value)) {
    fields.set(key, { node: primitive(val), count: 1 });
  }
  return { kind: "object", fields, count: 1 };
}

function array(values: unknown[]): Node {
  if (values.length === 0) return { kind: "array", item: { kind: "union", nodes: [] } };
  let item = primitive(values[0]);
  for (let i = 1; i < values.length; i += 1) item = merge(item, primitive(values[i]));
  return { kind: "array", item };
}

function samePrimitive(a: Node, b: Node): boolean {
  return a.kind === "primitive" && b.kind === "primitive" && a.name === b.name;
}

function merge(a: Node, b: Node): Node {
  if (a.kind === "null") return b.kind === "null" ? a : union([a, b]);
  if (b.kind === "null") return union([a, b]);
  if (samePrimitive(a, b)) return a;
  if (a.kind === "array" && b.kind === "array") return { kind: "array", item: merge(a.item, b.item) };
  if (a.kind === "object" && b.kind === "object") {
    const fields = new Map(a.fields);
    for (const [key, next] of b.fields) {
      const current = fields.get(key);
      fields.set(key, current
        ? { node: merge(current.node, next.node), count: current.count + next.count }
        : { node: next.node, count: next.count });
    }
    return { kind: "object", fields, count: a.count + b.count };
  }
  const flat = (n: Node): Node[] => (n.kind === "union" ? n.nodes : [n]);
  return union([...flat(a), ...flat(b)]);
}

function union(nodes: Node[]): Node {
  const unique: Node[] = [];
  for (const node of nodes) {
    if (!unique.some((x) => renderType(x, { rootName: "Root", optionalFields: false, readonly: false }) === renderType(node, { rootName: "Root", optionalFields: false, readonly: false }))) {
      unique.push(node);
    }
  }
  return unique.length === 1 ? unique[0] : { kind: "union", nodes: unique };
}

function isIdentifier(value: string): boolean {
  return /^[$A-Z_a-z][$\w]*$/.test(value);
}

function propertyName(name: string): string {
  return isIdentifier(name) ? name : JSON.stringify(name);
}

function renderType(node: Node, options: TypeOptions, indent = 0): string {
  switch (node.kind) {
    case "null": return "null";
    case "primitive": return node.name;
    case "union": return node.nodes.length ? node.nodes.map((n) => renderType(n, options, indent)).join(" | ") : "unknown";
    case "array": {
      const item = renderType(node.item, options, indent);
      return / \| /.test(item) ? `(${item})[]` : `${item}[]`;
    }
    case "object": {
      if (node.fields.size === 0) return "Record<string, unknown>";
      const pad = "  ".repeat(indent);
      const nextPad = "  ".repeat(indent + 1);
      const rows = Array.from(node.fields.entries()).map(([key, field]) => {
        const optional = options.optionalFields && field.count < node.count ? "?" : "";
        const read = options.readonly ? "readonly " : "";
        return `${nextPad}${read}${propertyName(key)}${optional}: ${renderType(field.node, options, indent + 1)};`;
      });
      return `{\n${rows.join("\n")}\n${pad}}`;
    }
  }
}

/** 将有效 JSON 推断成一个可读的 TypeScript interface。 */
export function jsonToTypeScript(input: string, options: TypeOptions): string {
  const value = JSON.parse(input) as unknown;
  const root = primitive(value);
  const name = options.rootName.trim().replace(/[^$\w]/g, "") || "Root";
  if (root.kind === "object") {
    const body = renderType(root, options).replace(/^\{\n|\n\}$/g, "");
    return `export interface ${name} {\n${body}\n}`;
  }
  return `export type ${name} = ${renderType(root, options)};`;
}
