// 日期计算 —— 原生 Date，零外部依赖。
//
// 约定：输入是 <input type="date"> 的 "YYYY-MM-DD"，按本地零点解析，
// 只算「天」粒度，不掺时区/夏令时的麻烦。

/** "YYYY-MM-DD" → 本地零点 Date；非法返回 null */
export function parseDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  // 拒绝 2 月 30 日这类被 Date 自动滚动的非法日期
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

/** Date → "YYYY-MM-DD"（本地） */
export function formatDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const MS_PER_DAY = 86_400_000;
const WEEKDAY_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function weekdayName(d: Date): string {
  return WEEKDAY_CN[d.getDay()];
}

export interface Interval {
  /** 含正负号的总天数（to − from） */
  totalDays: number;
  /** 拆成 年 / 月 / 天（始终非负，方向由 totalDays 符号体现） */
  years: number;
  months: number;
  days: number;
  /** 跨度内的工作日数（周一~周五，闭区间，与方向无关） */
  workdays: number;
  /** 完整周数（按总天数） */
  weeks: number;
}

/** 两日期间隔。a、b 顺序无所谓，totalDays 反映 b−a 的符号 */
export function diffDates(a: Date, b: Date): Interval {
  const totalDays = Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);

  // 年/月/天：从较早日期向较晚日期借位累减
  const [early, late] = a <= b ? [a, b] : [b, a];
  let years = late.getFullYear() - early.getFullYear();
  let months = late.getMonth() - early.getMonth();
  let days = late.getDate() - early.getDate();
  if (days < 0) {
    months -= 1;
    // 借用「late 上个月」的天数
    const borrow = new Date(late.getFullYear(), late.getMonth(), 0).getDate();
    days += borrow;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    totalDays,
    years,
    months,
    days,
    weeks: Math.trunc(Math.abs(totalDays) / 7),
    workdays: countWorkdays(early, late),
  };
}

/** 闭区间 [start, end] 内的工作日（周一~周五）数量 */
export function countWorkdays(start: Date, end: Date): number {
  if (end < start) return 0;
  let count = 0;
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export type Unit = "days" | "weeks" | "months" | "years";

/** 在 base 上加减 amount 个 unit，返回新日期 */
export function shiftDate(base: Date, amount: number, unit: Unit): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  switch (unit) {
    case "days":
      d.setDate(d.getDate() + amount);
      break;
    case "weeks":
      d.setDate(d.getDate() + amount * 7);
      break;
    case "months":
      d.setMonth(d.getMonth() + amount);
      break;
    case "years":
      d.setFullYear(d.getFullYear() + amount);
      break;
  }
  return d;
}
