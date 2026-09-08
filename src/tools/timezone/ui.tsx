"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextField } from "../../components/tools/inputs";
import { meta } from "./meta";

const DEFAULT_ZONES = [
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

function fmtIn(zone: string, d: Date): { date: string; time: string; offset: string } {
  try {
    const parts = new Intl.DateTimeFormat("zh-CN", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "shortOffset",
    }).formatToParts(d);

    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const date = `${get("year")}-${get("month")}-${get("day")}`;
    const time = `${get("hour")}:${get("minute")}:${get("second")}`;
    const offset = get("timeZoneName");
    return { date, time, offset };
  } catch {
    return { date: "—", time: "—", offset: "—" };
  }
}

export default function TimezoneUi() {
  const [now, setNow] = useState(() => new Date());
  const [extra, setExtra] = useState("");
  const [zones, setZones] = useState<string[]>(DEFAULT_ZONES);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const local = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  function addZone() {
    const z = extra.trim();
    if (!z) return;
    if (zones.includes(z)) {
      setExtra("");
      return;
    }
    try {
      new Intl.DateTimeFormat("zh-CN", { timeZone: z }).format(now);
      setZones((cur) => [...cur, z]);
      setExtra("");
    } catch {
      // invalid zone — ignored
    }
  }

  function removeZone(z: string) {
    setZones((cur) => cur.filter((x) => x !== z));
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-background p-3 text-sm">
          <span className="text-xs text-muted-foreground">本地时区</span>{" "}
          <code className="font-mono text-foreground">
            {local}
          </code>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">时区</th>
                <th className="px-3 py-2 text-left font-medium">日期</th>
                <th className="px-3 py-2 text-left font-medium">时间</th>
                <th className="px-3 py-2 text-left font-medium">偏移</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => {
                const r = fmtIn(z, now);
                return (
                  <tr
                    key={z}
                    className="border-t border-border"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{z}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.date}</td>
                    <td className="px-3 py-2 font-mono">{r.time}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                      {r.offset}
                    </td>
                    <td className="px-2">
                      <button
                        onClick={() => removeZone(z)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`移除 ${z}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ToolField label="添加时区" hint="如 Asia/Hong_Kong、America/Sao_Paulo">
          <div className="flex gap-2">
            <TextField
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addZone()}
              placeholder="IANA 时区名"
              className="flex-1 font-mono"
            />
            <button
              onClick={addZone}
              className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              添加
            </button>
          </div>
        </ToolField>
      </div>
    </ToolShell>
  );
}
