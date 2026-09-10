export const MAX_JSON_BYTES = 1024 * 1024;
export const MAX_JSONPATH_LENGTH = 2000;
export const MAX_JSONPATH_RESULTS = 1000;
export const MAX_RESULT_BYTES = 1024 * 1024;

export type JsonPathMatch = {
  path: string;
  pointer: string;
  value: unknown;
};

export async function queryJsonPath(
  source: string,
  expression: string,
): Promise<JsonPathMatch[]> {
  if (utf8ByteLength(source) > MAX_JSON_BYTES) {
    throw new Error("JSON 输入不能超过 1 MB。");
  }
  if (!expression.trim()) throw new Error("请输入 JSONPath 表达式。");
  if (expression.length > MAX_JSONPATH_LENGTH) {
    throw new Error("JSONPath 表达式不能超过 2,000 个字符。");
  }
  if (!expression.trim().startsWith("$")) {
    throw new Error("JSONPath 必须从根节点 $ 开始。");
  }
  if (/[?@()]/u.test(expression)) {
    throw new Error("为保护本地数据，筛选表达式、函数和脚本求值已禁用。请使用字段、下标、通配符、切片或递归查询。");
  }

  let json: unknown;
  try {
    json = JSON.parse(source);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`JSON 无法解析：${message}`);
  }

  const { JSONPath } = await import("jsonpath-plus");
  let resultCount = 0;
  let rawMatches: Array<{ path: string; pointer: string; value: unknown }>;
  try {
    rawMatches = JSONPath({
      path: expression,
      json: json as null | boolean | number | string | object | unknown[],
      resultType: "all",
      wrap: true,
      // 永远禁用 JSONPath-Plus 的脚本执行功能；上方也拒绝脚本语法。
      eval: false,
      callback: () => {
        resultCount += 1;
        if (resultCount > MAX_JSONPATH_RESULTS) {
          throw new Error("RESULT_LIMIT_REACHED");
        }
      },
    }) as Array<{ path: string; pointer: string; value: unknown }>;
  } catch (error) {
    if (error instanceof Error && error.message === "RESULT_LIMIT_REACHED") {
      throw new Error(`匹配结果不能超过 ${MAX_JSONPATH_RESULTS} 项。请缩小查询范围。`);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`JSONPath 无法执行：${message}`);
  }

  const matches = rawMatches.map(({ path, pointer, value }) => ({ path, pointer, value }));
  if (utf8ByteLength(JSON.stringify(matches)) > MAX_RESULT_BYTES) {
    throw new Error("匹配结果超过 1 MB。请缩小查询范围。");
  }
  return matches;
}

export function stringifyMatchedValues(matches: JsonPathMatch[]): string {
  return JSON.stringify(matches.map((match) => match.value), null, 2);
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
