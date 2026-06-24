// 贷款计算 —— 纯算法，零外部依赖。
//
// 两种主流还款方式：
//   equal-installment  等额本息：每月还款额固定，前期利息多本金少
//   equal-principal    等额本金：每月本金固定，月供逐月递减，总利息更少

export type RepayMethod = "equal-installment" | "equal-principal";

export interface LoanInput {
  /** 贷款本金（元） */
  principal: number;
  /** 年利率（百分数，如 4.9 表示 4.9%） */
  annualRatePct: number;
  /** 贷款期限（月） */
  months: number;
  method: RepayMethod;
}

export interface ScheduleRow {
  /** 期数，从 1 开始 */
  period: number;
  /** 当期月供 */
  payment: number;
  /** 当期本金 */
  principal: number;
  /** 当期利息 */
  interest: number;
  /** 剩余本金 */
  balance: number;
}

export interface LoanResult {
  /** 首月月供（等额本息每月相同；等额本金为首月） */
  firstPayment: number;
  /** 末月月供（等额本息同首月；等额本金最低） */
  lastPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule: ScheduleRow[];
}

/** 四舍五入到分，避免浮点误差累积 */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcLoan(input: LoanInput): LoanResult | null {
  const { principal, annualRatePct, months, method } = input;
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualRatePct) ||
    !Number.isFinite(months) ||
    principal <= 0 ||
    months <= 0 ||
    annualRatePct < 0
  ) {
    return null;
  }

  const r = annualRatePct / 100 / 12; // 月利率
  const n = Math.round(months);
  const schedule: ScheduleRow[] = [];
  let balance = principal;
  let totalPayment = 0;
  let totalInterest = 0;

  if (method === "equal-installment") {
    // 等额本息：M = P·r·(1+r)^n / ((1+r)^n − 1)；r=0 时退化为 P/n
    const monthly =
      r === 0
        ? principal / n
        : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    for (let i = 1; i <= n; i++) {
      const interest = round2(balance * r);
      let principalPart = round2(monthly - interest);
      // 末期把残余尾差并入，保证余额归零
      if (i === n) principalPart = round2(balance);
      const payment = round2(principalPart + interest);
      balance = round2(balance - principalPart);
      totalPayment += payment;
      totalInterest += interest;
      schedule.push({ period: i, payment, principal: principalPart, interest, balance });
    }
  } else {
    // 等额本金：每月本金固定 = P/n，利息按剩余本金计
    const principalPart = round2(principal / n);
    for (let i = 1; i <= n; i++) {
      const interest = round2(balance * r);
      let thisPrincipal = principalPart;
      if (i === n) thisPrincipal = round2(balance); // 末期补尾差
      const payment = round2(thisPrincipal + interest);
      balance = round2(balance - thisPrincipal);
      totalPayment += payment;
      totalInterest += interest;
      schedule.push({ period: i, payment, principal: thisPrincipal, interest, balance });
    }
  }

  return {
    firstPayment: schedule[0]?.payment ?? 0,
    lastPayment: schedule[schedule.length - 1]?.payment ?? 0,
    totalPayment: round2(totalPayment),
    totalInterest: round2(totalInterest),
    schedule,
  };
}

/** 货币格式化：千分位 + 两位小数 */
export function fmtMoney(n: number): string {
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
