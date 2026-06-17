"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

function fmtAll(ms: number) {
  const d = new Date(ms);
  return {
    sec: Math.floor(ms / 1000).toString(),
    ms: ms.toString(),
    iso: d.toISOString(),
    local: d.toString(),
    utc: d.toUTCString(),
  };
}

export default function TimestampUi() {
  const [now, setNow] = useState(() => Date.now());
  const [input, setInput] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const parsed = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) {
      const n = Number(trimmed);
      const ms = trimmed.length <= 10 ? n * 1000 : n;
      if (Number.isFinite(ms)) return fmtAll(ms);
    }
    const t = Date.parse(trimmed);
    if (!Number.isNaN(t)) return fmtAll(t);
    return null;
  }, [input]);

  const live = fmtAll(now);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-2 text-xs font-medium text-slate-500">当前时间</div>
          <KV k="秒" v={live.sec} />
          <KV k="毫秒" v={live.ms} />
          <KV k="ISO" v={live.iso} />
          <KV k="本地" v={live.local} />
        </section>

        <ToolField
          label="输入时间戳或日期字符串"
          hint="支持 10/13 位数字或任意可解析日期"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1734633600 或 2024-12-20T00:00:00Z"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </ToolField>

        {input && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-2 text-xs font-medium text-slate-500">解析结果</div>
            {parsed ? (
              <>
                <KV k="秒" v={parsed.sec} />
                <KV k="毫秒" v={parsed.ms} />
                <KV k="ISO" v={parsed.iso} />
                <KV k="本地" v={parsed.local} />
                <KV k="UTC" v={parsed.utc} />
              </>
            ) : (
              <div className="text-sm text-red-600">无法解析</div>
            )}
          </section>
        )}
      </div>
    </ToolShell>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 py-1.5 last:border-0 dark:border-slate-800">
      <div className="w-12 shrink-0 text-[11px] text-slate-400">{k}</div>
      <div className="min-w-0 flex-1 truncate font-mono text-xs text-slate-800 dark:text-slate-200">
        {v}
      </div>
      <CopyButton value={v} />
    </div>
  );
}
