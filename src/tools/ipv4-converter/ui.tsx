"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextField } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { convertIPv4, type IPv4Details, type IPv4InputFormat } from "./lib";
import { meta } from "./meta";

const FORMAT_OPTIONS: readonly { value: IPv4InputFormat; label: string }[] = [
  { value: "dotted", label: "点分十进制" },
  { value: "binary", label: "二进制" },
  { value: "hex", label: "十六进制" },
  { value: "decimal", label: "32 位整数" },
];

const SAMPLES: Record<IPv4InputFormat, string> = {
  dotted: "192.168.1.42/24",
  binary: "11000000101010000000000100101010/24",
  hex: "0xC0A80101/24",
  decimal: "3232235818/24",
};

export default function Ipv4ConverterUi() {
  const [format, setFormat] = useState<IPv4InputFormat>("dotted");
  const [input, setInput] = useState(SAMPLES.dotted);
  const result = useMemo(() => {
    try {
      return { details: convertIPv4(input, format), error: "" };
    } catch (caught) {
      return {
        details: null,
        error: caught instanceof Error ? caught.message : "IPv4 地址无效。",
      };
    }
  }, [input, format]);

  function changeFormat(next: IPv4InputFormat) {
    setFormat(next);
    setInput(SAMPLES[next]);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <ToolField label="输入格式">
          <Segmented<IPv4InputFormat>
            value={format}
            onChange={changeFormat}
            options={FORMAT_OPTIONS}
            className="max-w-full overflow-x-auto"
          />
        </ToolField>

        <ToolField label="IPv4 地址" hint="可选 CIDR，例如 /24">
          <TextField
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={SAMPLES[format]}
            inputMode="text"
            spellCheck={false}
            aria-invalid={Boolean(result.error)}
            className="font-mono"
          />
        </ToolField>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setInput(SAMPLES[format])}>
            <Sparkles className="h-4 w-4" />
            填入示例
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInput("")} disabled={!input}>
            <RotateCcw className="h-3.5 w-3.5" />
            清空
          </Button>
        </div>

        {result.error && <ErrorBox>{result.error}</ErrorBox>}
        {result.details && <AddressDetails details={result.details} />}
      </div>
    </ToolShell>
  );
}

function AddressDetails({ details }: { details: IPv4Details }) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">地址表示</h2>
          {details.cidr && <span className="font-mono text-xs text-muted-foreground">{details.cidr}</span>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ValueRow label="点分十进制" value={details.address} />
          <ValueRow label="二进制（按八位组）" value={details.binary} mono />
          <ValueRow label="32 位十六进制" value={details.hex} mono />
          <ValueRow label="无符号十进制整数" value={details.decimal} mono />
        </div>
      </section>

      {details.prefix === null ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          输入 CIDR 前缀（例如 `/24`）后，可计算子网掩码、网络地址、广播地址和主机范围。
        </div>
      ) : (
        <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-foreground">CIDR 子网信息</h2>
            <span className="font-mono text-xs text-muted-foreground">/{details.prefix}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ValueRow label="子网掩码" value={details.subnetMask ?? ""} />
            <ValueRow label="通配掩码" value={details.wildcardMask ?? ""} />
            <ValueRow label="网络地址" value={details.networkAddress ?? ""} />
            <ValueRow label="广播地址" value={details.broadcastAddress ?? ""} />
            <ValueRow label="地址总数" value={formatCount(details.totalAddresses)} />
            <ValueRow label="可用主机数" value={formatCount(details.usableHostCount)} />
            <ValueRow label="可用主机范围" value={details.usableHostRange ?? ""} />
          </div>
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            /31 按点到点链路将两个地址都视为可用，/32 表示单个主机地址。
          </p>
        </section>
      )}
    </div>
  );
}

function ValueRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/70 bg-muted/30 p-2.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <CopyButton value={value} />
      </div>
      <div className={`break-all text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</div>
    </div>
  );
}

function formatCount(value: number | null): string {
  return value === null ? "" : value.toLocaleString("zh-CN");
}
