export type PercentOperation = "of" | "change" | "discount" | "markup";

export type PercentResult = {
  operation: PercentOperation;
  value: number;
  detail: string;
};

export function calculatePercent(
  operation: PercentOperation,
  amount: number,
  percent: number,
  comparison = 0,
): PercentResult {
  if (![amount, percent, comparison].every(Number.isFinite)) {
    throw new Error("请输入有效数字");
  }
  if (operation === "of") {
    const value = amount * percent / 100;
    return { operation, value, detail: `${percent}% × ${amount} = ${value}` };
  }
  if (operation === "change") {
    const value = amount * (1 + percent / 100);
    return { operation, value, detail: `${amount} 增加 ${percent}% = ${value}` };
  }
  if (operation === "discount") {
    const value = amount * (1 - percent / 100);
    return { operation, value, detail: `${amount} 打 ${percent}% 折扣 = ${value}` };
  }
  const value = amount * (1 + percent / 100);
  return { operation, value, detail: `${amount} 加价 ${percent}% = ${value}` };
}

export function percentageChange(from: number, to: number): number {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) {
    throw new Error("起始值必须是非零有效数字");
  }
  return (to - from) / Math.abs(from) * 100;
}
