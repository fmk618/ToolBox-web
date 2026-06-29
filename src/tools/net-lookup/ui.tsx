"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { cn } from "../../lib/utils";
import { meta } from "./meta";
import { lookupIp, resolveDns, type DnsRecord, type IpInfo } from "./lib";

type Mode = "ip" | "dns";

export default function NetLookupUi() {
  const [mode, setMode] = useState<Mode>("ip");
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          {(
            [
              { id: "ip", label: "IP 查询" },
              { id: "dns", label: "域名解析" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm transition-colors",
                m.id === mode
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "ip" ? <IpPanel /> : <DnsPanel />}

        <p className="text-xs leading-relaxed text-muted-foreground">
          IP 归属地来自 ipwho.is，域名解析走 Google DNS-over-HTTPS。两类查询需联网，
          请求由浏览器直连，不经本项目后端。
        </p>
      </div>
    </ToolShell>
  );
}

function IpPanel() {
  const [ip, setIp] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<IpInfo | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setInfo(null);
    const { info, error } = await lookupIp(ip);
    if (error) setError(error);
    else setInfo(info ?? null);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <ToolField label="IP 地址" hint="留空查询本机出口 IP">
        <div className="flex gap-2">
          <input
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="如 8.8.8.8 / 2606:4700:4700::1111"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm dark:text-foreground"
          />
          <SearchBtn loading={loading} onClick={run} />
        </div>
      </ToolField>

      {error && <ErrorBox text={error} />}

      {info && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-foreground/15 bg-accent p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                IP（{info.type}）
              </span>
              <CopyButton value={info.ip} />
            </div>
            <div className="mt-1 break-all font-mono text-2xl font-semibold text-foreground">
              {info.ip}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {info.flag} {info.country} · {info.region} · {info.city}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <Stat label="运营商 ISP" value={info.isp || "—"} />
            <Stat label="组织" value={info.org || "—"} />
            <Stat label="ASN" value={info.asn || "—"} />
            <Stat label="经纬度" value={`${info.lat}, ${info.lng}`} />
            <Stat label="时区" value={info.timezone || "—"} />
            <Stat label="UTC 偏移" value={info.utc || "—"} />
          </div>
        </div>
      )}
    </div>
  );
}

function DnsPanel() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<DnsRecord[] | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    setRecords(null);
    const { records, error } = await resolveDns(domain);
    if (error) setError(error);
    else setRecords(records);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <ToolField label="域名">
        <div className="flex gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="如 github.com"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm dark:text-foreground"
          />
          <SearchBtn loading={loading} onClick={run} />
        </div>
      </ToolField>

      {error && <ErrorBox text={error} />}

      {records && records.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid grid-cols-[64px_1fr_72px] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>类型</span>
            <span>记录值</span>
            <span className="text-right">TTL</span>
          </div>
          {records.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[64px_1fr_72px] items-center gap-2 border-b border-border/50 px-3 py-2 text-sm last:border-0"
            >
              <span className="font-mono text-xs font-medium text-foreground">
                {r.type}
              </span>
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate font-mono text-foreground">{r.data}</span>
                <CopyButton value={r.data} />
              </span>
              <span className="text-right font-mono text-xs text-muted-foreground">
                {r.ttl}s
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      aria-label="查询"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Search className="h-4 w-4" />
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium text-foreground" title={value}>
        {value}
      </div>
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
      {text}
    </div>
  );
}
