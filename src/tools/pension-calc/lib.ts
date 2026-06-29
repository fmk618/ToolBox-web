// 中国「渐进式延迟法定退休年龄」计算
//
// 依据：全国人大常委会 2024-09-13《关于实施渐进式延迟法定退休年龄的决定》
// 及国务院《渐进式延迟法定退休年龄的办法》（国发〔2024〕18号），2025-01-01 起施行。
//
// 三类人群、统一以 2025-01 为基准月，按出生年月分批次延迟：
//   男职工            原 60 → 63 岁，每 4 个月延迟 1 个月，封顶 +36 个月
//   女职工（原 55）   原 55 → 58 岁，每 4 个月延迟 1 个月，封顶 +36 个月
//   女职工（原 50）   原 50 → 55 岁，每 2 个月延迟 1 个月，封顶 +60 个月
// 任何分数都向上进 1；封顶在向上取整「之后」再生效；2025-01 前已达原龄者不受影响。

export type Category = "man" | "woman55" | "woman50";

interface CategoryParam {
  /** 原法定退休年龄（周岁） */
  originalAge: number;
  /** 每 divisor 个月延迟 1 个月 */
  divisor: number;
  /** 最大延迟月数（封顶） */
  maxDelay: number;
}

const PARAMS: Record<Category, CategoryParam> = {
  man: { originalAge: 60, divisor: 4, maxDelay: 36 }, // → 63
  woman55: { originalAge: 55, divisor: 4, maxDelay: 36 }, // → 58
  woman50: { originalAge: 50, divisor: 2, maxDelay: 60 }, // → 55
};

export const CATEGORY_LABEL: Record<Category, string> = {
  man: "男职工",
  woman55: "女职工 · 原 55 岁（管理 / 技术岗）",
  woman50: "女职工 · 原 50 岁（工人岗）",
};

export interface RetirementResult {
  category: Category;
  /** 原法定退休年龄（周岁） */
  originalAge: number;
  /** 延迟月数 0..maxDelay */
  delayMonths: number;
  /** 延迟后法定退休年龄 = newAgeYears 周岁 newAgeMonths 个月 */
  newAgeYears: number;
  newAgeMonths: number;
  /** 预计退休年月 */
  retireYear: number;
  retireMonth: number;
  /** 该退休年份对应的最低缴费年限（年，可能含 0.5） */
  minContributionYears: number;
  /** true = 2025-01 前已达原法定退休年龄，不受延迟影响 */
  unaffected: boolean;
  /** 弹性提前可到的最早年龄（周岁，月） —— 不早于原法定年龄 */
  elasticEarliest: { years: number; months: number };
  /** 弹性延后可到的最晚年龄（周岁，月） —— 法定年龄 + 3 年 */
  elasticLatest: { years: number; months: number };
}

function splitAge(totalMonths: number): { years: number; months: number } {
  return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}

/** 该退休年份的最低缴费年限：≤2029 为 15 年，2030 起每年 +0.5，2039 起 20 年封顶。 */
export function minContributionYears(retireYear: number): number {
  if (retireYear <= 2029) return 15;
  if (retireYear >= 2039) return 20;
  return 15 + (retireYear - 2029) * 0.5;
}

/**
 * 计算法定退休年龄与退休年月。
 * @param birthYear  出生年（公历，如 1980）
 * @param birthMonth 出生月（1..12）
 */
export function computeRetirement(
  birthYear: number,
  birthMonth: number,
  category: Category,
): RetirementResult {
  const p = PARAMS[category];

  // 原退休年月（达到原法定年龄的那个月）
  const origYear = birthYear + p.originalAge;
  // 以 2025-01 为基准（==1）的批次序号
  const n = (origYear - 2025) * 12 + birthMonth;

  let delayMonths: number;
  let unaffected = false;
  if (n <= 0) {
    delayMonths = 0;
    unaffected = true;
  } else {
    delayMonths = Math.min(Math.ceil(n / p.divisor), p.maxDelay);
  }

  const newTotal = p.originalAge * 12 + delayMonths;
  const { years: newAgeYears, months: newAgeMonths } = splitAge(newTotal);

  // 退休年月 = 原退休年月 + 延迟月数
  const retireAbs = origYear * 12 + (birthMonth - 1) + delayMonths;
  const retireYear = Math.floor(retireAbs / 12);
  const retireMonth = (retireAbs % 12) + 1;

  // 弹性：最早不早于原法定年龄（提前最多 3 年），最晚为法定年龄 + 3 年
  const elasticEarliest = splitAge(Math.max(newTotal - 36, p.originalAge * 12));
  const elasticLatest = splitAge(newTotal + 36);

  return {
    category,
    originalAge: p.originalAge,
    delayMonths,
    newAgeYears,
    newAgeMonths,
    retireYear,
    retireMonth,
    minContributionYears: minContributionYears(retireYear),
    unaffected,
    elasticEarliest,
    elasticLatest,
  };
}
