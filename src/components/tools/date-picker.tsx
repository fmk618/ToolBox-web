"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../lib/utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function parseDateValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

function formatDateValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDateLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(a: Date | null, b: Date): boolean {
  return Boolean(
    a &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate(),
  );
}

function isToday(date: Date): boolean {
  return isSameDay(new Date(), date);
}

export function DatePicker({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const selected = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupId = `date-picker-${useId()}`;

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const days = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    const firstCell = new Date(first);
    firstCell.setDate(firstCell.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(firstCell);
      day.setDate(firstCell.getDate() + index);
      return day;
    });
  }, [visibleMonth]);

  const monthLabel = visibleMonth.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  const chooseDate = (date: Date) => {
    onChange(formatDateValue(date));
    setVisibleMonth(startOfMonth(date));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openPicker = () => {
    setVisibleMonth(startOfMonth(selected ?? new Date()));
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={popupId}
        onClick={open ? () => setOpen(false) : openPicker}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-3 rounded-xl border border-input bg-background px-3 text-left text-sm text-foreground shadow-sm transition-colors",
          "hover:border-foreground/40 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selected ? formatDateLabel(selected) : "选择日期"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          id={popupId}
          role="dialog"
          aria-label={`${monthLabel}日期选择`}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl shadow-black/10"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <div>
              <div className="text-sm font-semibold text-foreground">{monthLabel}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">选择一个日期</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="上一个月"
                onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="下一个月"
                onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 pb-1" aria-hidden="true">
            {WEEKDAYS.map((day) => (
              <span
                key={day}
                className="grid h-7 place-items-center text-[11px] font-medium text-muted-foreground"
              >
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === visibleMonth.getMonth();
              const selectedDay = isSameDay(selected, day);
              const today = isToday(day);

              return (
                <button
                  key={formatDateValue(day)}
                  type="button"
                  aria-label={formatDateLabel(day)}
                  aria-current={today ? "date" : undefined}
                  onClick={() => chooseDate(day)}
                  className={cn(
                    "relative grid h-9 place-items-center rounded-lg text-xs transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-ring/50",
                    selectedDay
                      ? "bg-foreground font-semibold text-background shadow-sm"
                      : inMonth
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground/40 hover:bg-muted/60",
                    today && !selectedDay && "ring-1 ring-ring/50",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border px-1 pt-3">
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                onChange("");
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              清除
            </button>
            <button
              type="button"
              onClick={() => chooseDate(new Date())}
              className="rounded-md px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              今天
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
