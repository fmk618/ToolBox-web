export type RateResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

export const CURRENCIES = [
  ["CNY", "人民币 CNY"], ["USD", "美元 USD"], ["EUR", "欧元 EUR"], ["GBP", "英镑 GBP"],
  ["JPY", "日元 JPY"], ["HKD", "港元 HKD"], ["KRW", "韩元 KRW"], ["AUD", "澳元 AUD"],
  ["CAD", "加元 CAD"], ["SGD", "新加坡元 SGD"], ["CHF", "瑞士法郎 CHF"], ["THB", "泰铢 THB"],
] as const;

/** Frankfurter aggregates ECB reference rates; no API key or user data needed. */
export async function fetchRate(from: string, to: string, signal?: AbortSignal): Promise<RateResponse> {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { signal });
  if (!res.ok) throw new Error(`汇率服务请求失败（HTTP ${res.status}）`);
  const data = await res.json() as RateResponse;
  if (!data.rates?.[to]) throw new Error("该货币对暂不支持");
  return data;
}
