"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { Segmented } from "../../components/tools/segmented";
import { TextField } from "../../components/tools/inputs";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { STATUS_GROUPS, METHODS, PORTS } from "./lib";

type Tab = "status" | "method" | "port";

export default function HttpRefUi() {
  const [tab, setTab] = useState<Tab>("status");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const statusGroups = useMemo(() => {
    if (!query) return STATUS_GROUPS;
    return STATUS_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) =>
          i.code.includes(query) ||
          i.name.toLowerCase().includes(query) ||
          i.desc.toLowerCase().includes(query),
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  const methods = useMemo(() => {
    if (!query) return METHODS;
    return METHODS.filter(
      (m) =>
        m.method.toLowerCase().includes(query) ||
        m.desc.toLowerCase().includes(query),
    );
  }, [query]);

  const ports = useMemo(() => {
    if (!query) return PORTS;
    return PORTS.filter(
      (p) =>
        String(p.port).includes(query) ||
        p.proto.toLowerCase().includes(query) ||
        p.desc.toLowerCase().includes(query),
    );
  }, [query]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Segmented<Tab>
            value={tab}
            onChange={setTab}
            options={[
              { value: "status", label: "状态码" },
              { value: "method", label: "请求方法" },
              { value: "port", label: "常用端口" },
            ]}
          />
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <TextField
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索：404 / redirect / 443 …"
              className="pl-8"
            />
          </div>
        </div>

        {tab === "status" &&
          (statusGroups.length === 0 ? (
            <Empty />
          ) : (
            <div className="space-y-5">
              {statusGroups.map((g) => (
                <section key={g.cls}>
                  <h2 className={`mb-2 text-xs font-semibold tracking-wider ${g.tone}`}>
                    {g.cls} · {g.label}
                  </h2>
                  <div className="overflow-hidden rounded-xl border border-border bg-background">
                    <table className="w-full text-sm">
                      <tbody>
                        {g.items.map((i) => (
                          <tr key={i.code} className="border-b border-border last:border-0">
                            <td className="w-16 px-3 py-2 font-mono font-semibold text-foreground">
                              {i.code}
                            </td>
                            <td className="w-52 px-3 py-2 font-mono text-xs text-muted-foreground">
                              {i.name}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{i.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          ))}

        {tab === "method" &&
          (methods.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-background">
              <table className="w-full text-sm">
                <tbody>
                  {methods.map((m) => (
                    <tr key={m.method} className="border-b border-border last:border-0">
                      <td className="w-24 px-3 py-2 font-mono font-semibold text-foreground">
                        {m.method}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{m.desc}</td>
                      <td className="w-32 px-3 py-2 text-xs">
                        <Badge on={m.safe}>安全</Badge>
                        <Badge on={m.idem}>幂等</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "port" &&
          (ports.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {ports.map((p) => (
                <div
                  key={p.port}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <span className="w-14 font-mono text-base font-semibold text-foreground">
                    {p.port}
                  </span>
                  <span className="font-mono text-xs font-medium text-brand">{p.proto}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">{p.desc}</span>
                  <CopyButton value={String(p.port)} />
                </div>
              ))}
            </div>
          ))}

        <p className="text-center text-[11px] text-muted-foreground">
          纯静态数据，离线可用 · 不联网
        </p>
      </div>
    </ToolShell>
  );
}

function Badge({ on, children }: { on: boolean; children: string }) {
  return (
    <span
      className={`mr-1 inline-block rounded px-1.5 py-0.5 ${
        on ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground/50"
      }`}
    >
      {children}
    </span>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      没有匹配的条目
    </div>
  );
}
