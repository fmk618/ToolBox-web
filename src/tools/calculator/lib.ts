/** Safe expression evaluator for the calculator.
 *
 * Input is sanitized against a strict whitelist (digits, decimal, ops, parens,
 * whitespace). Anything else returns null without ever reaching `Function`.
 * Display chars `×` `÷` are normalized to `*` `/` before evaluation.
 */
const SAFE_RE = /^[0-9+\-*/.()%\s]*$/;

export function normalizeDisplay(expr: string): string {
  return expr.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
}

export function evaluate(displayExpr: string): number | null {
  const raw = normalizeDisplay(displayExpr).trim();
  if (!raw) return null;
  if (!SAFE_RE.test(raw)) return null;
  try {
    // Function constructor with strict whitelist above is safe here.
    // eslint-disable-next-line no-new-func
    const r = Function(`"use strict";return (${raw})`)();
    if (typeof r !== "number" || !Number.isFinite(r)) return null;
    // Round away floating noise (0.1+0.2 = 0.30000000000000004)
    return Math.round(r * 1e12) / 1e12;
  } catch {
    return null;
  }
}
