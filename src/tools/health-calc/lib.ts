export type Sex = "male" | "female";
export type Activity = "low" | "light" | "medium" | "high" | "very-high";

export const ACTIVITY_FACTORS: Record<Activity, { label: string; factor: number }> = {
  low: { label: "久坐（几乎不运动）", factor: 1.2 },
  light: { label: "轻度（每周 1–3 天）", factor: 1.375 },
  medium: { label: "中度（每周 3–5 天）", factor: 1.55 },
  high: { label: "高强度（每周 6–7 天）", factor: 1.725 },
  "very-high": { label: "极高强度（体力劳动/训练）", factor: 1.9 },
};

export function bmi(weightKg: number, heightCm: number): number | null {
  if (!(weightKg > 0 && heightCm > 0)) return null;
  return weightKg / (heightCm / 100) ** 2;
}

export function bmiLabel(value: number): { label: string; tone: string } {
  if (value < 18.5) return { label: "偏瘦", tone: "text-amber-700 dark:text-amber-300" };
  if (value < 24) return { label: "正常", tone: "text-green-700 dark:text-green-400" };
  if (value < 28) return { label: "超重", tone: "text-amber-700 dark:text-amber-300" };
  return { label: "肥胖", tone: "text-destructive" };
}

/** Mifflin–St Jeor equation, kcal/day. */
export function bmr(weightKg: number, heightCm: number, age: number, sex: Sex): number | null {
  if (!(weightKg > 0 && heightCm > 0 && age > 0)) return null;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
}

export function healthyWeightRange(heightCm: number): [number, number] | null {
  if (!(heightCm > 0)) return null;
  const meters = heightCm / 100;
  return [18.5 * meters ** 2, 23.9 * meters ** 2];
}
