type Token = {
  text: string;
  kind: "word" | "symbol" | "literal" | "comment";
};

type Clause = {
  words: readonly string[];
  kind: "list" | "condition" | "join" | "normal";
};

type SectionState = {
  kind: Clause["kind"];
  depth: number;
  indent: number;
  listDepth: number;
  header: string;
};

const CLAUSES: readonly Clause[] = [
  { words: ["LEFT", "OUTER", "JOIN"], kind: "join" },
  { words: ["RIGHT", "OUTER", "JOIN"], kind: "join" },
  { words: ["FULL", "OUTER", "JOIN"], kind: "join" },
  { words: ["NATURAL", "LEFT", "JOIN"], kind: "join" },
  { words: ["NATURAL", "RIGHT", "JOIN"], kind: "join" },
  { words: ["NATURAL", "JOIN"], kind: "join" },
  { words: ["LEFT", "JOIN"], kind: "join" },
  { words: ["RIGHT", "JOIN"], kind: "join" },
  { words: ["FULL", "JOIN"], kind: "join" },
  { words: ["INNER", "JOIN"], kind: "join" },
  { words: ["CROSS", "JOIN"], kind: "join" },
  { words: ["DELETE", "FROM"], kind: "normal" },
  { words: ["INSERT", "INTO"], kind: "normal" },
  { words: ["GROUP", "BY"], kind: "list" },
  { words: ["ORDER", "BY"], kind: "list" },
  { words: ["UNION", "ALL"], kind: "normal" },
  { words: ["FETCH", "FIRST"], kind: "normal" },
  { words: ["SELECT"], kind: "list" },
  { words: ["FROM"], kind: "normal" },
  { words: ["WHERE"], kind: "condition" },
  { words: ["HAVING"], kind: "condition" },
  { words: ["LIMIT"], kind: "normal" },
  { words: ["OFFSET"], kind: "normal" },
  { words: ["UNION"], kind: "normal" },
  { words: ["EXCEPT"], kind: "normal" },
  { words: ["INTERSECT"], kind: "normal" },
  { words: ["UPDATE"], kind: "normal" },
  { words: ["SET"], kind: "list" },
  { words: ["VALUES"], kind: "list" },
  { words: ["RETURNING"], kind: "list" },
  { words: ["WITH"], kind: "normal" },
  { words: ["ON"], kind: "condition" },
  { words: ["JOIN"], kind: "join" },
  { words: ["CREATE"], kind: "normal" },
  { words: ["ALTER"], kind: "normal" },
  { words: ["DROP"], kind: "normal" },
];

const KEYWORDS = new Set([
  ...CLAUSES.flatMap((clause) => clause.words),
  "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN",
  "EXISTS", "DISTINCT", "ALL", "ASC", "DESC", "CASE", "WHEN", "THEN",
  "ELSE", "END", "OVER", "PARTITION", "INTO", "TABLE", "PRIMARY", "KEY",
  "FOREIGN", "REFERENCES", "DEFAULT", "IF", "BEGIN", "COMMIT", "ROLLBACK",
  "TRUE", "FALSE", "CURRENT_DATE", "CURRENT_TIME", "CURRENT_TIMESTAMP",
]);

const TIGHT_OPERATORS = new Set([
  ".", "::", "->", "->>", "#>", "#>>", "#-", "||",
]);

function readQuoted(sql: string, start: number, quote: string): [string, number] {
  let index = start + 1;
  while (index < sql.length) {
    if (sql[index] === quote) {
      if (sql[index + 1] === quote) {
        index += 2;
        continue;
      }
      const end = index + 1;
      return [sql.slice(start, end), end];
    }
    if (sql[index] === "\\" && index + 1 < sql.length) index += 2;
    else index += 1;
  }
  throw new Error("字符串或引号标识符未闭合");
}

function readBracketIdentifier(sql: string, start: number): [string, number] {
  let index = start + 1;
  while (index < sql.length) {
    if (sql[index] === "]") {
      if (sql[index + 1] === "]") {
        index += 2;
        continue;
      }
      const end = index + 1;
      return [sql.slice(start, end), end];
    }
    index += 1;
  }
  throw new Error("方括号标识符未闭合");
}

function readDollarQuoted(sql: string, start: number): [string, number] | null {
  const tag = sql.slice(start).match(/^\$[A-Za-z_][\w]*\$|^\$\$/u)?.[0];
  if (!tag) return null;
  const end = sql.indexOf(tag, start + tag.length);
  if (end < 0) throw new Error("Dollar-quoted 字符串未闭合");
  const next = end + tag.length;
  return [sql.slice(start, next), next];
}

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  for (let index = 0; index < sql.length;) {
    const ch = sql[index];
    if (/\s/u.test(ch)) {
      index += 1;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      const [text, next] = readQuoted(sql, index, ch);
      tokens.push({ text, kind: "literal" });
      index = next;
      continue;
    }
    if (ch === "[") {
      const [text, next] = readBracketIdentifier(sql, index);
      tokens.push({ text, kind: "literal" });
      index = next;
      continue;
    }
    if (ch === "$") {
      const dollarQuoted = readDollarQuoted(sql, index);
      if (dollarQuoted) {
        tokens.push({ text: dollarQuoted[0], kind: "literal" });
        index = dollarQuoted[1];
        continue;
      }
    }
    if (ch === "-" && sql[index + 1] === "-") {
      const end = sql.indexOf("\n", index + 2);
      const next = end < 0 ? sql.length : end;
      tokens.push({ text: sql.slice(index, next), kind: "comment" });
      index = next;
      continue;
    }
    if (ch === "/" && sql[index + 1] === "*") {
      const end = sql.indexOf("*/", index + 2);
      if (end < 0) throw new Error("块注释未闭合");
      const next = end + 2;
      tokens.push({ text: sql.slice(index, next), kind: "comment" });
      index = next;
      continue;
    }

    const number = sql.slice(index).match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/u);
    if (number) {
      tokens.push({ text: number[0], kind: "word" });
      index += number[0].length;
      continue;
    }
    const parameter = sql.slice(index).match(/^[:@$][A-Za-z_]\w*|^\$\d+/u);
    if (parameter) {
      tokens.push({ text: parameter[0], kind: "word" });
      index += parameter[0].length;
      continue;
    }
    const word = sql.slice(index).match(/^[A-Za-z_]\w*|^\$\w+/u);
    if (word) {
      tokens.push({ text: word[0], kind: "word" });
      index += word[0].length;
      continue;
    }

    if (/[(),;.?]/u.test(ch)) {
      tokens.push({ text: ch, kind: "symbol" });
      index += 1;
      continue;
    }
    const operator = sql.slice(index).match(/^(?:<=>|!<|!>|:=|::|->>|#>>|->|#>|#-|<>|!=|<=|>=|\|\||&&|@>|<@|\?\?|\?&|\?\||[-+*/%=<>!~^|&]+)/u);
    if (operator) {
      tokens.push({ text: operator[0], kind: "symbol" });
      index += operator[0].length;
      continue;
    }

    tokens.push({ text: ch, kind: "symbol" });
    index += 1;
  }
  return tokens;
}

function clauseAt(tokens: readonly Token[], index: number): { clause: Clause; size: number } | null {
  for (const clause of CLAUSES) {
    const matches = clause.words.every((word, offset) => (
      tokens[index + offset]?.kind === "word" &&
      tokens[index + offset].text.toUpperCase() === word
    ));
    if (matches) return { clause, size: clause.words.length };
  }
  return null;
}

function renderKeyword(text: string, uppercase: boolean): string {
  const upper = text.toUpperCase();
  return uppercase ? upper : upper.toLowerCase();
}

function tokenText(token: Token, uppercase: boolean): string {
  if (token.kind === "word" && KEYWORDS.has(token.text.toUpperCase())) {
    return renderKeyword(token.text, uppercase);
  }
  return token.text;
}

function isOperator(token: Token | null): boolean {
  return token?.kind === "symbol" && token.text !== "," && token.text !== "." && token.text !== ")" && token.text !== "(";
}

function isUnaryOperator(token: Token, previous: Token | null): boolean {
  if (token.text !== "+" && token.text !== "-") return false;
  return !previous || previous.text === "(" || previous.text === "," || isOperator(previous) ||
    (previous.kind === "word" && ["BETWEEN", "AND", "OR", "NOT", "IN", "THEN", "ELSE"].includes(previous.text.toUpperCase()));
}

function needsSpace(previous: Token | null, token: Token, previousUnary: boolean): boolean {
  if (!previous) return false;
  if (token.text === ")" || token.text === "]" || token.text === "," || token.text === ";" || token.text === ".") return false;
  if (previous.text === "(" || previous.text === ".") return false;
  if (TIGHT_OPERATORS.has(token.text) || TIGHT_OPERATORS.has(previous.text)) return false;
  if (token.text === "(") {
    return previous.kind === "word" &&
      ["IN", "NOT", "VALUES", "FROM", "WHERE", "ON", "AS", "SELECT", "EXISTS"].includes(previous.text.toUpperCase());
  }
  if (previous.text === ")") return token.text !== "(";
  if (previousUnary) return false;
  if (isUnaryOperator(token, previous)) return previous.text === "(" || previous.text === "," ? false : true;
  if (isOperator(previous) || isOperator(token)) return true;
  return true;
}

/** Readable SQL formatter for common SELECT / DML statements; literals and comments are preserved verbatim. */
export function formatSql(input: string, uppercase = true): string {
  const tokens = tokenize(input);
  if (!tokens.length) return "";

  const lines: string[] = [];
  const sectionStack: SectionState[] = [];
  const betweenStack: (number | null)[] = [];
  let line = "";
  let previous: Token | null = null;
  let previousUnary = false;
  let depth = 0;
  let betweenDepth: number | null = null;
  let section: SectionState = { kind: "normal", depth: 0, indent: 0, listDepth: 0, header: "" };

  const indentation = (level: number) => "  ".repeat(Math.max(0, level));
  const push = () => {
    if (line.trim()) lines.push(line.trimEnd());
    line = "";
    previous = null;
    previousUnary = false;
  };
  const start = (level: number) => {
    if (!line) line = indentation(level);
  };
  const append = (token: Token, text = tokenText(token, uppercase), level = section.kind === "list" && depth === section.listDepth ? section.listDepth + 1 : depth) => {
    start(level);
    const insertColumnList = token.text === "(" &&
      section.header === "INSERT INTO" &&
      previous?.kind === "word";
    const unary = isUnaryOperator(token, previous);
    if ((needsSpace(previous, token, previousUnary) || insertColumnList) && !line.endsWith(" ")) line += " ";
    line += text;
    previous = token;
    previousUnary = unary;
  };

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const found = token.kind === "word" ? clauseAt(tokens, index) : null;

    if (found) {
      push();
      const keyword = found.clause.words.map((word) => renderKeyword(word, uppercase)).join(" ");
      const kind = found.clause.kind;
      const baseDepth = depth;
      const clauseIndent = kind === "condition" && keyword === renderKeyword("ON", uppercase)
        ? baseDepth + 1
        : baseDepth;
      const continuationIndent = kind === "condition" ? baseDepth + 1 : baseDepth;
      line = `${indentation(clauseIndent)}${keyword}`;
      previous = { text: found.clause.words[found.size - 1], kind: "word" };
      previousUnary = false;
      betweenDepth = null;
      section = { kind, depth: baseDepth, indent: continuationIndent, listDepth: baseDepth, header: keyword };
      index += found.size - 1;
      continue;
    }

    if (token.kind === "comment") {
      push();
      line = `${indentation(depth)}${token.text}`;
      push();
      continue;
    }

    const upper = token.text.toUpperCase();
    if (upper === "BETWEEN" && section.kind === "condition" && depth === section.depth) {
      betweenDepth = depth;
    }
    if ((upper === "AND" || upper === "OR") &&
      (section.kind === "condition" || section.kind === "join") &&
      depth === section.depth && line.trim()) {
      if (upper === "AND" && betweenDepth === depth) {
        betweenDepth = null;
        append(token);
        continue;
      }
      betweenDepth = null;
      push();
      line = `${indentation(section.indent)}${renderKeyword(token.text, uppercase)}`;
      previous = token;
      previousUnary = false;
      continue;
    }

    const startsListItem = section.kind === "list" &&
      line.trim() === section.header &&
      !["DISTINCT", "ALL"].includes(upper);
    if (startsListItem && token.text !== "(") {
      push();
      append(token, undefined, section.listDepth + 1);
      continue;
    }
    if (startsListItem) push();

    if (token.text === "(") {
      append(token, "(", startsListItem ? section.listDepth + 1 : depth);
      sectionStack.push(section);
      betweenStack.push(betweenDepth);
      depth += 1;
      continue;
    }

    if (token.text === ")") {
      if (depth === 0) throw new Error(`括号不匹配：多余的右括号（索引 ${index}）`);
      const parentSection = sectionStack[sectionStack.length - 1];
      if (parentSection &&
        (parentSection.header !== section.header || parentSection.depth !== section.depth) &&
        line.trim()) {
        push();
        line = `${indentation(parentSection.depth)})`;
        previous = token;
        previousUnary = false;
      } else {
        append(token, ")");
      }
      depth -= 1;
      section = sectionStack.pop() ?? { kind: "normal", depth: 0, indent: 0, listDepth: 0, header: "" };
      betweenDepth = betweenStack.pop() ?? null;
      continue;
    }

    if (token.text === ",") {
      append(token, ",");
      if (section.kind === "list" && depth === section.listDepth) {
        push();
        line = indentation(section.listDepth + 1);
      }
      continue;
    }

    if (token.text === ";") {
      append(token, ";");
      push();
      section = { kind: "normal", depth: 0, indent: 0, listDepth: 0, header: "" };
      depth = 0;
      sectionStack.length = 0;
      betweenStack.length = 0;
      betweenDepth = null;
      continue;
    }

    append(token);
  }

  if (depth !== 0) throw new Error("括号不匹配：缺少右括号");
  push();
  return lines.join("\n");
}
