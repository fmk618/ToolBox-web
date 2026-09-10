"use client";

import { useMemo, useState } from "react";
import { ErrorBox } from "../../components/tools/error-box";
import { TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { calculateDuration } from "./lib";
import { meta } from "./meta";

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function DateDurationUi() {
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const result = useMemo(() => {
    try { return { value: calculateDuration(start, end), error: "" }; }
    catch (error) { return { value: null, error: error instanceof Error ? error.message : "计算失败" }; }
  }, [start, end]);
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ToolField label="开始日期"><TextField type="date" value={start} onChange={(event) => setStart(event.target.value)} /></ToolField>
          <ToolField label="结束日期"><TextField type="date" value={end} onChange={(event) => setEnd(event.target.value)} /></ToolField>
        </div>
        {result.error ? <ErrorBox>{result.error}</ErrorBox> : result.value && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/20 p-4"><div className="text-xs text-muted-foreground">相差天数</div><div className="mt-1 text-2xl font-semibold text-foreground">{result.value.days}</div><div className="text-xs text-muted-foreground">不含结束日</div></div>
            <div className="rounded-xl border border-border bg-muted/20 p-4"><div className="text-xs text-muted-foreground">包含首尾</div><div className="mt-1 text-2xl font-semibold text-foreground">{result.value.calendarDaysInclusive}</div><div className="text-xs text-muted-foreground">自然日</div></div>
            <div className="rounded-xl border border-border bg-muted/20 p-4"><div className="text-xs text-muted-foreground">工作日</div><div className="mt-1 text-2xl font-semibold text-foreground">{result.value.weekdays}</div><div className="text-xs text-muted-foreground">周一至周五，含首尾</div></div>
          </div>
        )}
        <p className="text-center text-xs leading-5 text-muted-foreground">按日历日期计算，不受本地夏令时切换影响；工作日不包含周六、周日和法定节假日。</p>
      </div>
    </ToolShell>
  );
}
