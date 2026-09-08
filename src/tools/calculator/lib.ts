/** Safe expression evaluator for the calculator.
 *
 * Hand-written recursive descent parser — no `Function()` / eval involved, so
 * there is no dynamic code execution surface at all. Any invalid input yields
 * null. Display chars `×` `÷` `−` are normalized to `*` `/` `-` first.
 *
 * Grammar (lowest to highest precedence):
 *   expr    := term (('+'|'-') term)*
 *   term    := unary (('*'|'/'|'%') unary)*   // % = modulo, as before
 *   unary   := ('+'|'-') unary | primary
 *   primary := NUMBER | '(' expr ')'
 */
export function normalizeDisplay(expr: string): string {
  return expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
}

class ParseError extends Error {}

class Parser {
  private pos = 0;
  constructor(private readonly src: string) {}

  parse(): number {
    const v = this.expr();
    this.skipWs();
    if (this.pos !== this.src.length) throw new ParseError("trailing input");
    return v;
  }

  private skipWs(): void {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) {
      this.pos += 1;
    }
  }

  private peek(): string | null {
    this.skipWs();
    return this.pos < this.src.length ? this.src[this.pos] : null;
  }

  private take(ch: string): boolean {
    if (this.peek() === ch) {
      this.pos += 1;
      return true;
    }
    return false;
  }

  private expr(): number {
    let v = this.term();
    for (;;) {
      if (this.take("+")) v += this.term();
      else if (this.take("-")) v -= this.term();
      else return v;
    }
  }

  private term(): number {
    let v = this.unary();
    for (;;) {
      if (this.take("*")) v *= this.unary();
      else if (this.take("/")) v /= this.unary();
      else if (this.take("%")) v %= this.unary();
      else return v;
    }
  }

  private unary(): number {
    if (this.take("-")) return -this.unary();
    if (this.take("+")) return this.unary();
    return this.primary();
  }

  private primary(): number {
    this.skipWs();
    if (this.src[this.pos] === "(") {
      this.pos += 1;
      const v = this.expr();
      if (!this.take(")")) throw new ParseError("missing )");
      return v;
    }
    const start = this.pos;
    while (this.pos < this.src.length && /[0-9.]/.test(this.src[this.pos])) {
      this.pos += 1;
    }
    const num = this.src.slice(start, this.pos);
    // JS numeric literal without exponent: 5 / 5. / 5.5 / .5
    if (!/^(\d+(\.\d*)?|\.\d+)$/.test(num)) throw new ParseError("bad number");
    return Number(num);
  }
}

export function evaluate(displayExpr: string): number | null {
  const raw = normalizeDisplay(displayExpr).trim();
  if (!raw) return null;
  let r: number;
  try {
    r = new Parser(raw).parse();
  } catch {
    return null;
  }
  if (!Number.isFinite(r)) return null;
  // Round away floating noise (0.1+0.2 = 0.30000000000000004)
  return Math.round(r * 1e12) / 1e12;
}
