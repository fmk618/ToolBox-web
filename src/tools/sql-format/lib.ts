const CLAUSE = new Set([
  "SELECT", "FROM", "WHERE", "HAVING", "LIMIT", "OFFSET", "UNION", "EXCEPT", "INTERSECT",
  "INSERT", "UPDATE", "DELETE", "SET", "VALUES", "RETURNING", "WITH", "CREATE", "ALTER", "DROP",
  "GROUP BY", "ORDER BY", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN", "CROSS JOIN", "JOIN", "ON",
]);
const KEYWORDS = new Set([
  ...Array.from(CLAUSE).flatMap((x) => x.split(" ")),
  "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "BETWEEN", "EXISTS", "DISTINCT", "ALL",
  "ASC", "DESC", "CASE", "WHEN", "THEN", "ELSE", "END", "OVER", "PARTITION", "BY", "INTO", "TABLE",
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "DEFAULT", "IF", "BEGIN", "COMMIT", "ROLLBACK",
]);

type Token = { text: string; kind: "word" | "symbol" | "literal" | "comment" };

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  for (let i = 0; i < sql.length;) {
    const ch = sql[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch; let text = ch; i += 1;
      while (i < sql.length) {
        text += sql[i];
        if (sql[i] === quote) {
          if (sql[i + 1] === quote && quote === "'") { text += sql[i + 1]; i += 2; continue; }
          i += 1; break;
        }
        if (sql[i] === "\\" && i + 1 < sql.length) { text += sql[i + 1]; i += 2; continue; }
        i += 1;
      }
      tokens.push({ text, kind: "literal" }); continue;
    }
    if (ch === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i); const text = sql.slice(i, end < 0 ? sql.length : end);
      tokens.push({ text, kind: "comment" }); i += text.length; continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2); const text = sql.slice(i, end < 0 ? sql.length : end + 2);
      tokens.push({ text, kind: "comment" }); i += text.length; continue;
    }
    if (/[(),;]/.test(ch)) { tokens.push({ text: ch, kind: "symbol" }); i += 1; continue; }
    if (/[<>=!+*/%.-]/.test(ch)) {
      const match = sql.slice(i).match(/^(?:<>|!=|<=|>=|:=|\|\||[-+*/%=<>!]+)/);
      const text = match?.[0] ?? ch; tokens.push({ text, kind: "symbol" }); i += text.length; continue;
    }
    const match = sql.slice(i).match(/^[\w$]+/u);
    if (match) { tokens.push({ text: match[0], kind: "word" }); i += match[0].length; continue; }
    tokens.push({ text: ch, kind: "symbol" }); i += 1;
  }
  return tokens;
}

function normalized(tokens: Token[], index: number, size = 1): string {
  return tokens.slice(index, index + size).map((t) => t.text.toUpperCase()).join(" ");
}

/** Readable SQL formatter for common SELECT / DML statements; literals and comments are preserved verbatim. */
export function formatSql(input: string, uppercase = true): string {
  const tokens = tokenize(input);
  if (!tokens.length) return "";
  const lines: string[] = [];
  let line = "";
  let depth = 0;
  const push = () => { if (line.trim()) lines.push(line.trimEnd()); line = ""; };
  const write = (text: string, prefix = true) => { line += prefix && line && !line.endsWith(" ") ? ` ${text}` : text; };

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const upper = token.text.toUpperCase();
    const two = normalized(tokens, i, 2);
    const clause = CLAUSE.has(two) ? two : CLAUSE.has(upper) ? upper : "";
    const size = clause === two && two.includes(" ") ? 2 : 1;
    if (clause && (clause !== "ON" || line)) {
      push();
      const indent = "  ".repeat(Math.max(0, depth));
      write(`${indent}${uppercase ? clause : clause.toLowerCase()}`, false);
      i += size - 1;
      continue;
    }
    if (token.kind === "comment") { push(); write(`${"  ".repeat(depth)}${token.text}`, false); push(); continue; }
    if (token.text === "(") { write("("); depth += 1; continue; }
    if (token.text === ")") { line = line.trimEnd(); write(")", false); depth = Math.max(0, depth - 1); continue; }
    if (token.text === ",") { line = line.trimEnd(); write(",", false); push(); line = "  ".repeat(depth + 1); continue; }
    if (token.text === ";") { line = line.trimEnd(); write(";", false); push(); continue; }
    const text = token.kind === "word" && KEYWORDS.has(upper) ? (uppercase ? upper : upper.toLowerCase()) : token.text;
    write(text);
  }
  push();
  return lines.join("\n");
}
