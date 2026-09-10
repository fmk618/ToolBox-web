export type TimeBasis = "local" | "utc";
export type RepeatFrequency = "none" | "daily" | "weekly" | "monthly" | "yearly";

export type CalendarEventInput = {
  title: string;
  description: string;
  location: string;
  allDay: boolean;
  start: string;
  end: string;
  timeBasis: TimeBasis;
  reminderMinutes: number | null;
  repeat: RepeatFrequency;
  repeatCount: number;
};

export async function createCalendarEvent(input: CalendarEventInput): Promise<string> {
  const title = input.title.trim();
  if (!title) throw new Error("请输入事件标题。");
  if (title.length > 200) throw new Error("事件标题不能超过 200 个字符。");
  if (input.description.length > 10_000) throw new Error("事件说明不能超过 10,000 个字符。");
  if (input.location.length > 500) throw new Error("地点不能超过 500 个字符。");
  if (!Number.isInteger(input.repeatCount) || input.repeatCount < 1 || input.repeatCount > 366) {
    throw new Error("重复次数必须是 1 到 366 之间的整数。");
  }

  const start = input.allDay ? toDateParts(input.start) : toDateTimeParts(input.start);
  const end = input.allDay ? toDateParts(input.end) : toDateTimeParts(input.end);
  if (compareDateParts(end, start) < (input.allDay ? 0 : 1)) {
    throw new Error(input.allDay ? "结束日期不能早于开始日期。" : "结束时间必须晚于开始时间。");
  }

  const { createEvent } = await import("ics");
  const attributes = {
    title,
    ...(input.description.trim() && { description: input.description.trim() }),
    ...(input.location.trim() && { location: input.location.trim() }),
    start,
    end: input.allDay ? addDays(end as [number, number, number], 1) : end,
    ...(input.allDay
      ? {}
      : {
          startInputType: input.timeBasis,
          startOutputType: input.timeBasis,
          endInputType: input.timeBasis,
          endOutputType: input.timeBasis,
        }),
    ...(input.reminderMinutes !== null && {
      alarms: [
        {
          action: "display" as const,
          description: title,
          trigger: { minutes: input.reminderMinutes, before: true },
        },
      ],
    }),
    ...(input.repeat !== "none" && {
      recurrenceRule: `FREQ=${input.repeat.toUpperCase()};COUNT=${input.repeatCount}`,
    }),
    productId: "FMKTools",
    calName: "FMKTools 日历事件",
  };
  const { error, value } = createEvent(attributes);
  if (error || !value) {
    throw new Error(error?.message || "无法生成 ICS 文件。");
  }
  return value;
}

export function calendarDownloadName(title: string): string {
  const normalized = title.trim().replace(/[\\/:*?"<>|\0]/g, "-").slice(0, 80);
  return `${normalized || "calendar-event"}.ics`;
}

function toDateParts(value: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error("请选择有效的日期。");
  const result: [number, number, number] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (!isValidDateParts(result)) throw new Error("日期无效。");
  return result;
}

function toDateTimeParts(value: string): [number, number, number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error("请选择有效的日期和时间。");
  const result: [number, number, number, number, number] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  ];
  if (!isValidDateParts(result) || result[3] > 23 || result[4] > 59) {
    throw new Error("日期或时间无效。");
  }
  return result;
}

function isValidDateParts(parts: readonly number[]): boolean {
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function compareDateParts(left: readonly number[], right: readonly number[]): number {
  for (let index = 0; index < Math.min(left.length, right.length); index++) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

function addDays(parts: [number, number, number], days: number): [number, number, number] {
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + days));
  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];
}
