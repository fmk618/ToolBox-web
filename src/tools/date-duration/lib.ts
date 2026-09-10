export type DurationResult = {
  days: number;
  weekdays: number;
  calendarDaysInclusive: number;
};

function dateAtUtc(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) throw new Error("日期格式无效");
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) throw new Error("日期格式无效");
  return date;
}

export function calculateDuration(startValue: string, endValue: string): DurationResult {
  const start = dateAtUtc(startValue);
  const end = dateAtUtc(endValue);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days < 0) throw new Error("结束日期不能早于开始日期");
  let weekdays = 0;
  for (let offset = 0; offset <= days; offset += 1) {
    const weekday = new Date(start.getTime() + offset * 86400000).getUTCDay();
    if (weekday !== 0 && weekday !== 6) weekdays += 1;
  }
  return { days, weekdays, calendarDaysInclusive: days + 1 };
}
