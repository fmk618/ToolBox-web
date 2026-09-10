import type { Plugin } from "prettier";

export const MAX_FORMAT_SOURCE_BYTES = 500 * 1024;
export const MAX_FORMAT_RESULT_BYTES = 750 * 1024;

export type FormatLanguage = "javascript" | "typescript" | "html" | "css" | "markdown" | "yaml";

export type FormatOptions = {
  language: FormatLanguage;
  tabWidth: 2 | 4;
  semi: boolean;
  singleQuote: boolean;
};

export async function formatCode(source: string, options: FormatOptions): Promise<string> {
  if (!source.trim()) throw new Error("请输入要格式化的代码或文本。");
  if (utf8ByteLength(source) > MAX_FORMAT_SOURCE_BYTES) {
    throw new Error("输入不能超过 500 KB。请拆分较大的文件后再格式化。");
  }

  const { parser, plugins } = await loadParser(options.language);
  const { format } = await import("prettier/standalone");
  const result = await format(source, {
    parser,
    plugins,
    tabWidth: options.tabWidth,
    semi: options.semi,
    singleQuote: options.singleQuote,
    endOfLine: "lf",
  });
  if (utf8ByteLength(result) > MAX_FORMAT_RESULT_BYTES) {
    throw new Error("格式化结果超过 750 KB，已取消显示。请缩小输入范围。");
  }
  return result;
}

async function loadParser(language: FormatLanguage): Promise<{ parser: string; plugins: Plugin[] }> {
  switch (language) {
    case "javascript": {
      const [{ default: babel }, { default: estree }] = await Promise.all([
        import("prettier/plugins/babel.js"),
        import("prettier/plugins/estree.js"),
      ]);
      return { parser: "babel", plugins: [babel, estree] };
    }
    case "typescript": {
      const [{ default: typescript }, { default: estree }] = await Promise.all([
        import("prettier/plugins/typescript.js"),
        import("prettier/plugins/estree.js"),
      ]);
      return { parser: "typescript", plugins: [typescript, estree] };
    }
    case "html": {
      const { default: html } = await import("prettier/plugins/html.js");
      return { parser: "html", plugins: [html] };
    }
    case "css": {
      const { default: postcss } = await import("prettier/plugins/postcss.js");
      return { parser: "css", plugins: [postcss] };
    }
    case "markdown": {
      const { default: markdown } = await import("prettier/plugins/markdown.js");
      return { parser: "markdown", plugins: [markdown] };
    }
    case "yaml": {
      const { default: yaml } = await import("prettier/plugins/yaml.js");
      return { parser: "yaml", plugins: [yaml] };
    }
  }
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
