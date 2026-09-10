export const MAX_JSON_SCHEMA_BYTES = 1024 * 1024;
export const MAX_SCHEMA_ERRORS = 100;

export type SchemaDraft = "draft-07" | "2020-12";

export type SchemaIssue = {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  message: string;
};

export type SchemaValidationResult = {
  valid: boolean;
  issues: SchemaIssue[];
  truncated: boolean;
};

export async function validateJsonSchema(
  dataSource: string,
  schemaSource: string,
  draft: SchemaDraft,
): Promise<SchemaValidationResult> {
  if (utf8ByteLength(dataSource) > MAX_JSON_SCHEMA_BYTES) {
    throw new Error("待校验 JSON 不能超过 1 MB。");
  }
  if (utf8ByteLength(schemaSource) > MAX_JSON_SCHEMA_BYTES) {
    throw new Error("JSON Schema 不能超过 1 MB。");
  }

  const data = parseJson(dataSource, "待校验 JSON");
  const schema = parseJson(schemaSource, "JSON Schema");
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    throw new Error("JSON Schema 根节点必须是对象。");
  }
  ensureOnlyLocalReferences(schema);

  const [{ default: addFormats }, ajvModule] = await Promise.all([
    import("ajv-formats"),
    draft === "2020-12" ? import("ajv/dist/2020.js") : import("ajv"),
  ]);
  const Ajv = ajvModule.default;
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    validateFormats: true,
  });
  addFormats(ajv);

  let validate: ReturnType<typeof ajv.compile>;
  try {
    // 未提供 loadSchema，也不调用 compileAsync：任何远程 $ref 都不会被请求。
    validate = ajv.compile(schema);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Schema 无法编译：${message}`);
  }

  const valid = Boolean(validate(data));
  const allIssues = (validate.errors ?? []).map((error) => ({
    instancePath: error.instancePath || "/",
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message ?? "不符合约束",
  }));
  return {
    valid,
    issues: allIssues.slice(0, MAX_SCHEMA_ERRORS),
    truncated: allIssues.length > MAX_SCHEMA_ERRORS,
  };
}

function parseJson(source: string, label: string): unknown {
  if (!source.trim()) throw new Error(`请输入${label}。`);
  try {
    return JSON.parse(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${label}无法解析：${message}`);
  }
}

function ensureOnlyLocalReferences(value: unknown): void {
  const stack: unknown[] = [value];
  let visitedNodes = 0;
  while (stack.length) {
    const current = stack.pop();
    if (!current || typeof current !== "object") continue;
    visitedNodes += 1;
    if (visitedNodes > 50_000) {
      throw new Error("Schema 结构过于复杂，最多支持 50,000 个对象或数组节点。");
    }
    for (const [key, child] of Object.entries(current)) {
      if (
        (key === "$ref" || key === "$dynamicRef" || key === "$recursiveRef") &&
        typeof child === "string" &&
        !child.startsWith("#")
      ) {
        throw new Error("仅支持以 # 开头的本地 $ref；不会读取网络或其他文件中的 Schema。");
      }
      if (child && typeof child === "object") stack.push(child);
    }
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
