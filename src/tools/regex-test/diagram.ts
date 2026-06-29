// 正则表达式可视化 —— 用 regexp-tree 解析为 AST，自行渲染成铁路图风格 SVG。
// 全部用固定配色（白底），并对元字符 / 锚点 / 量词加中文注释，确保「看得懂」；
// 输出为完整 SVG 字符串，便于导出 PNG / SVG。
import regexpTree from "regexp-tree";
const { parse } = regexpTree;

interface Frag {
  markup: string;
  w: number;
  h: number;
  cy: number; // 连接点（垂直中心）
}

const MONO = `font-family="ui-monospace, SFMono-Regular, Menlo, monospace"`;
const SANS = `font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"`;

const C = {
  literal: { fill: "#eff6ff", stroke: "#3b82f6", text: "#1e3a8a" },
  meta: { fill: "#ecfdf5", stroke: "#10b981", text: "#065f46" },
  klass: { fill: "#faf5ff", stroke: "#a855f7", text: "#6b21a8" },
  anchor: { fill: "#f8fafc", stroke: "#94a3b8", text: "#475569" },
  backref: { fill: "#fff7ed", stroke: "#f97316", text: "#9a3412" },
  line: "#94a3b8",
  caption: "#94a3b8",
};

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );

// 粗略字宽：CJK 视为全宽，其余 0.6 倍
function tw(s: string, size: number): number {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 255 ? size : size * 0.6;
  return w;
}

const line = (x1: number, y1: number, x2: number, y2: number) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.line}" stroke-width="1.5"/>`;

function termBox(
  token: string,
  caption: string,
  colors: { fill: string; stroke: string; text: string },
): Frag {
  const boxH = 30;
  const w = Math.max(36, Math.max(tw(token, 13), tw(caption, 10)) + 18);
  const h = caption ? boxH + 15 : boxH;
  let m = `<rect x="0" y="0" width="${w}" height="${boxH}" rx="7" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.5"/>`;
  m += `<text x="${w / 2}" y="${boxH / 2}" ${MONO} font-size="13" fill="${colors.text}" text-anchor="middle" dominant-baseline="central">${esc(token)}</text>`;
  if (caption)
    m += `<text x="${w / 2}" y="${boxH + 10}" ${SANS} font-size="10" fill="${C.caption}" text-anchor="middle">${esc(caption)}</text>`;
  return { markup: m, w, h, cy: boxH / 2 };
}

function capCircle(): Frag {
  return { markup: `<circle cx="6" cy="15" r="6" fill="#475569"/>`, w: 12, h: 30, cy: 15 };
}

function sequence(frags: Frag[]): Frag {
  const items = frags.length ? frags : [termBox("ε", "空", C.anchor)];
  const GAP = 22;
  const cy = Math.max(...items.map((f) => f.cy));
  const parts: string[] = [];
  let x = 0;
  let prevExit: number | null = null;
  let bottom = 0;
  items.forEach((f) => {
    const oy = cy - f.cy;
    if (prevExit !== null) parts.push(line(prevExit, cy, x, cy));
    parts.push(`<g transform="translate(${x},${oy})">${f.markup}</g>`);
    prevExit = x + f.w;
    x = prevExit + GAP;
    bottom = Math.max(bottom, oy + f.h);
  });
  return { markup: parts.join(""), w: prevExit ?? 0, h: bottom, cy };
}

function choice(alts: Frag[]): Frag {
  const RAIL = 20;
  const VGAP = 14;
  const innerW = Math.max(...alts.map((a) => a.w));
  const w = innerW + RAIL * 2;
  const parts: string[] = [];
  const centers: number[] = [];
  let y = 0;
  alts.forEach((a) => {
    parts.push(`<g transform="translate(${RAIL},${y})">${a.markup}</g>`);
    const cYa = y + a.cy;
    centers.push(cYa);
    if (a.w < innerW) parts.push(line(RAIL + a.w, cYa, RAIL + innerW, cYa));
    parts.push(line(RAIL + innerW, cYa, w - RAIL, cYa));
    y += a.h + VGAP;
  });
  const h = y - VGAP;
  const top = centers[0];
  const bot = centers[centers.length - 1];
  const cy = (top + bot) / 2;
  parts.push(line(RAIL, top, RAIL, bot)); // left rail
  parts.push(line(w - RAIL, top, w - RAIL, bot)); // right rail
  parts.push(line(0, cy, RAIL, cy)); // entry stub
  parts.push(line(w - RAIL, cy, w, cy)); // exit stub
  return { markup: parts.join(""), w, h, cy };
}

function container(
  child: Frag,
  label: string,
  opts: { stroke: string; labelBg: string; labelText: string; dashed?: boolean },
): Frag {
  const PADX = 12;
  const PADTOP = 22;
  const PADBOT = 10;
  const w = child.w + PADX * 2;
  const h = child.h + PADTOP + PADBOT;
  const cy = PADTOP + child.cy;
  const dash = opts.dashed ? ` stroke-dasharray="5 3"` : "";
  let m = `<rect x="0" y="0" width="${w}" height="${h}" rx="9" fill="none" stroke="${opts.stroke}" stroke-width="1.5"${dash}/>`;
  const lw = tw(label, 10) + 14;
  m += `<rect x="0" y="0" width="${lw}" height="16" rx="6" fill="${opts.labelBg}"/>`;
  m += `<text x="7" y="8" ${SANS} font-size="10" fill="${opts.labelText}" dominant-baseline="central">${esc(label)}</text>`;
  m += `<g transform="translate(${PADX},${PADTOP})">${child.markup}</g>`;
  m += line(0, cy, PADX, cy) + line(w - PADX, cy, w, cy);
  return { markup: m, w, h, cy };
}

function quantLabel(q: any): string {
  const g = q.greedy ? "" : "（懒惰）";
  switch (q.kind) {
    case "*": return "重复 0 或多个" + g;
    case "+": return "重复 1 或多个" + g;
    case "?": return "可选（0 或 1）" + g;
    case "Range":
      if (q.from === q.to) return `重复 ${q.from} 次` + g;
      if (q.to == null) return `重复 ${q.from} 或更多次` + g;
      return `重复 ${q.from}~${q.to} 次` + g;
    default: return "重复";
  }
}

const META_CAP: Record<string, string> = {
  "\\d": "数字", "\\D": "非数字", "\\w": "单词字符", "\\W": "非单词字符",
  "\\s": "空白", "\\S": "非空白", ".": "任意字符",
};
const ESC_CAP: Record<string, string> = {
  "\\n": "换行", "\\t": "制表符", "\\r": "回车", "\\f": "换页", "\\v": "垂直制表",
};
const ANCHOR_CAP: Record<string, string> = {
  "^": "行首", "$": "行尾", "\\b": "单词边界", "\\B": "非单词边界",
};

function classChar(c: any): string {
  return c.type === "ClassRange"
    ? `${c.from.symbol ?? c.from.value}-${c.to.symbol ?? c.to.value}`
    : c.symbol ?? c.value;
}

function flattenDisjunction(node: any): any[] {
  const out: any[] = [];
  const walk = (n: any) => {
    if (n && n.type === "Disjunction") {
      walk(n.left);
      walk(n.right);
    } else out.push(n);
  };
  walk(node);
  return out;
}

function render(node: any): Frag {
  if (!node) return termBox("ε", "空", C.anchor);
  switch (node.type) {
    case "RegExp":
      return render(node.body);
    case "Alternative":
      return sequence((node.expressions as any[]).map(render));
    case "Disjunction":
      return choice(flattenDisjunction(node).map(render));
    case "Repetition":
      return container(render(node.expression), quantLabel(node.quantifier), {
        stroke: "#f59e0b", labelBg: "#fef3c7", labelText: "#b45309", dashed: true,
      });
    case "Group": {
      const label = node.capturing
        ? node.name
          ? `命名分组 <${node.name}>`
          : `分组 #${node.number}`
        : "非捕获分组";
      return container(render(node.expression), label, {
        stroke: "#cbd5e1", labelBg: "#f1f5f9", labelText: "#475569",
      });
    }
    case "Assertion": {
      if (node.kind === "Lookahead" || node.kind === "Lookbehind") {
        const dir = node.kind === "Lookahead" ? "先行" : "后行";
        const label = `${node.negative ? "负向" : "正向"}${dir}断言`;
        return container(render(node.assertion), label, {
          stroke: "#94a3b8", labelBg: "#f1f5f9", labelText: "#475569", dashed: true,
        });
      }
      return termBox(node.kind, ANCHOR_CAP[node.kind] ?? "断言", C.anchor);
    }
    case "CharacterClass": {
      const inner = (node.expressions as any[]).map(classChar).join("");
      return termBox(
        `[${node.negative ? "^" : ""}${inner}]`,
        node.negative ? "排除这些字符" : "字符集合",
        C.klass,
      );
    }
    case "Backreference":
      return termBox(
        node.kind === "name" ? `\\k<${node.reference}>` : `\\${node.number}`,
        "反向引用",
        C.backref,
      );
    case "Char": {
      if (node.kind === "meta")
        return termBox(node.value, META_CAP[node.value] ?? "元字符", C.meta);
      const tok = node.value;
      return termBox(node.symbol ?? tok, ESC_CAP[tok] ?? "字符", C.literal);
    }
    default:
      return termBox(node.type, "", C.anchor);
  }
}

export interface DiagramResult {
  svg: string;
  width: number;
  height: number;
}

export function buildRegexDiagram(
  pattern: string,
  flags: string,
): DiagramResult | { error: string } {
  if (!pattern) return { error: "输入正则表达式后，这里会画出它的结构图" };
  let ast: any;
  try {
    ast = parse(`/${pattern}/${flags}`);
  } catch (e) {
    return { error: "无法解析该正则：" + (e instanceof Error ? e.message : "语法错误") };
  }
  let body: Frag;
  try {
    body = render(ast);
  } catch (e) {
    return { error: "渲染失败：" + (e instanceof Error ? e.message : String(e)) };
  }
  const full = sequence([capCircle(), body, capCircle()]);
  const PAD = 22;
  const width = Math.ceil(full.w + PAD * 2);
  const height = Math.ceil(full.h + PAD * 2);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<rect width="${width}" height="${height}" fill="#ffffff"/>` +
    `<g transform="translate(${PAD},${PAD})">${full.markup}</g>` +
    `</svg>`;
  return { svg, width, height };
}
