"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, RefreshCw, Wifi } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextField } from "../../components/tools/inputs";
import { Select } from "../../components/tools/select";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { meta } from "./meta";
import { CURRENCIES, fetchRate } from "./lib";

const OPTIONS = CURRENCIES.map(([value, label]) => ({ value, label }));

export default function ExchangeRateUi() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("CNY");
  const [rate, setRate] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seq = useRef(0);

  async function refresh() {
    if (from === to) { setRate(1); setDate("相同货币"); setError(""); setLoading(false); return; }
    const id = ++seq.current;
    setLoading(true);
    setError("");
    try {
      const data = await fetchRate(from, to);
      if (id !== seq.current) return;
      setRate(data.rates[to]);
      setDate(data.date);
    } catch (e) {
      if (id !== seq.current) return;
      setRate(null);
      setError(e instanceof Error ? e.message : "无法获取汇率");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }

  // Fetching is an external synchronization; refresh owns its loading lifecycle.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, [from, to]);

  const validAmount = Number(amount);
  const result = rate !== null && Number.isFinite(validAmount) ? validAmount * rate : null;
  const format = (n: number) => new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 4 }).format(n);

  function swap() { setFrom(to); setTo(from); }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-2 text-xs text-brand">
          <Wifi className="mr-1 inline h-3.5 w-3.5" />此工具会联网请求 Frankfurter 公开参考汇率接口；仅发送货币代码，不会上传金额或其他个人数据。
        </div>
        <section className="grid gap-4 rounded-xl border border-border bg-background p-4 md:grid-cols-[1fr_2.5rem_1fr]">
          <div className="space-y-3">
            <ToolField label="从"><Select value={from} onChange={setFrom} options={OPTIONS} /></ToolField>
            <ToolField label={`金额（${from}）`}><TextField type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} /></ToolField>
          </div>
          <div className="flex items-center justify-center"><Button variant="outline" size="sm" onClick={swap} aria-label="交换货币"><ArrowLeftRight className="h-4 w-4" /></Button></div>
          <div className="space-y-3">
            <ToolField label="换为"><Select value={to} onChange={setTo} options={OPTIONS} /></ToolField>
            <div className="rounded-lg bg-muted px-3 py-2.5"><div className="text-xs text-muted-foreground">换算结果</div><div className="mt-1 min-h-7 text-xl font-semibold tabular-nums text-foreground">{loading ? "加载汇率…" : result === null ? "—" : `${format(result)} ${to}`}</div></div>
          </div>
        </section>
        {error ? <ErrorBox>{error}</ErrorBox> : rate !== null && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"><span>1 {from} = <strong className="font-mono text-foreground">{format(rate)} {to}</strong></span><span className="text-muted-foreground/50">·</span><span>参考日期：{date}</span><Button variant="ghost" size="sm" className="ml-auto" onClick={refresh} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />刷新</Button></div>}
        <p className="text-center text-[11px] text-muted-foreground">汇率来自欧洲央行参考数据，经 Frankfurter 服务提供，仅供参考，不构成交易报价。</p>
      </div>
    </ToolShell>
  );
}
