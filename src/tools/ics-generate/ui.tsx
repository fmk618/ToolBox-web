"use client";

import { Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import {
  calendarDownloadName,
  createCalendarEvent,
  type CalendarEventInput,
  type RepeatFrequency,
  type TimeBasis,
} from "./lib";
import { meta } from "./meta";

const INITIAL_FORM: CalendarEventInput = {
  title: "",
  description: "",
  location: "",
  allDay: false,
  start: "",
  end: "",
  timeBasis: "local",
  reminderMinutes: null,
  repeat: "none",
  repeatCount: 1,
};

const REMINDER_OPTIONS = [
  { value: "none", label: "不提醒" },
  { value: "5", label: "提前 5 分钟" },
  { value: "15", label: "提前 15 分钟" },
  { value: "30", label: "提前 30 分钟" },
  { value: "60", label: "提前 1 小时" },
  { value: "1440", label: "提前 1 天" },
] as const;

export default function IcsGenerateUi() {
  const [form, setForm] = useState<CalendarEventInput>(INITIAL_FORM);
  const [calendar, setCalendar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof CalendarEventInput>(key: K, value: CalendarEventInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setCalendar(null);
    setError(null);
  }

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const content = await createCalendarEvent(form);
      setCalendar(content);
      const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = calendarDownloadName(form.title);
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (caught) {
      setCalendar(null);
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setForm(INITIAL_FORM);
    setCalendar(null);
    setError(null);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          生成的 <code className="font-mono text-foreground">.ics</code> 文件可导入 Apple Calendar、Google Calendar 和 Outlook。事件信息仅保留在当前页面内存中，生成时直接下载。
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolField label="事件标题" hint="必填，最多 200 字符">
            <TextField value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="例如：产品发布会" maxLength={200} />
          </ToolField>
          <ToolField label="地点" hint="可选">
            <TextField value={form.location} onChange={(event) => update("location", event.target.value)} placeholder="例如：会议室 A / 在线会议" maxLength={500} />
          </ToolField>
        </div>

        <ToolField label="事件说明" hint="可选，最多 10,000 字符">
          <TextArea value={form.description} onChange={(event) => update("description", event.target.value)} className="min-h-28 resize-y" maxLength={10_000} placeholder="补充议程、链接或备注" mono={false} />
        </ToolField>

        <ToolField label="事件类型">
          <Segmented
            value={form.allDay ? "all-day" : "timed"}
            onChange={(value) => {
              update("allDay", value === "all-day");
              update("start", "");
              update("end", "");
            }}
            options={[
              { value: "timed", label: "定时事件" },
              { value: "all-day", label: "全天事件" },
            ]}
          />
        </ToolField>

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolField label={form.allDay ? "开始日期" : "开始时间"}>
            <TextField
              type={form.allDay ? "date" : "datetime-local"}
              value={form.start}
              onChange={(event) => update("start", event.target.value)}
            />
          </ToolField>
          <ToolField label={form.allDay ? "结束日期（包含）" : "结束时间"}>
            <TextField
              type={form.allDay ? "date" : "datetime-local"}
              value={form.end}
              onChange={(event) => update("end", event.target.value)}
            />
          </ToolField>
        </div>

        {!form.allDay && (
          <ToolField label="时间基准" hint="输入的时钟时间将按此基准写入 ICS">
            <Segmented<TimeBasis>
              value={form.timeBasis}
              onChange={(value) => update("timeBasis", value)}
              options={[
                { value: "local", label: "设备本地时间" },
                { value: "utc", label: "UTC" },
              ]}
            />
          </ToolField>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <ToolField label="提醒">
            <select
              value={form.reminderMinutes === null ? "none" : String(form.reminderMinutes)}
              onChange={(event) => update("reminderMinutes", event.target.value === "none" ? null : Number(event.target.value))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              {REMINDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </ToolField>
          <ToolField label="重复">
            <select
              value={form.repeat}
              onChange={(event) => update("repeat", event.target.value as RepeatFrequency)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
            >
              <option value="none">不重复</option>
              <option value="daily">每天</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="yearly">每年</option>
            </select>
          </ToolField>
        </div>

        {form.repeat !== "none" && (
          <ToolField label="重复次数" hint="1 到 366 次">
            <TextField
              type="number"
              min={1}
              max={366}
              value={form.repeatCount}
              onChange={(event) => update("repeatCount", Number(event.target.value))}
            />
          </ToolField>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void generate()} disabled={busy || !form.title.trim() || !form.start || !form.end}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            生成并下载 ICS
          </Button>
          <Button variant="ghost" onClick={reset} disabled={busy}>
            <RotateCcw className="h-3.5 w-3.5" />
            清空
          </Button>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        {calendar && (
          <section className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
              <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" />已生成 ICS</div>
              <CopyButton value={calendar} />
            </div>
            <pre className="max-h-80 overflow-auto bg-muted/30 p-3 text-xs leading-5 whitespace-pre-wrap break-words">{calendar}</pre>
          </section>
        )}
      </div>
    </ToolShell>
  );
}
