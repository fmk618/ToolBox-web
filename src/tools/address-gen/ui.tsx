"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Select } from "../../components/tools/select";
import { meta } from "./meta";
import { COUNTRIES, generate, type CountryCode, type FakeIdentity } from "./lib";

const COUNTRY_OPTS = COUNTRIES.map((c) => ({ value: c.code, label: c.label }));

export default function AddressGenUi() {
  const [country, setCountry] = useState<CountryCode>("SG");
  const [id, setId] = useState<FakeIdentity | null>(null);

  // generate on mount and whenever the country changes (client-only — ssr:false)
  useEffect(() => {
    setId(generate(country));
  }, [country]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <ToolField label="国家 / 地区">
              <Select
                value={country}
                onChange={(v) => setCountry(v as CountryCode)}
                options={COUNTRY_OPTS}
                ariaLabel="国家"
              />
            </ToolField>
          </div>
          <button
            onClick={() => setId(generate(country))}
            className="flex h-10 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            重新生成
          </button>
        </div>

        {id && (
          <div className="grid gap-4 md:grid-cols-2">
            <Section title="个人">
              <Row label="姓名" value={id.name} extra={`${id.title} · ${id.gender}`} />
              <Row label="出生日期" value={id.birthday} extra={`${id.age} 岁`} />
              <Row label="身高 / 体重" value={`${id.height} / ${id.weight}`} />
              <Row label="血型" value={`${id.bloodType} 型`} last />
            </Section>

            <Section title="联系 / 账号">
              <Row label="电话" value={id.phone} />
              <Row label="邮箱" value={id.email} />
              <Row label="用户名" value={id.username} />
              <Row label="密码" value={id.password} last />
            </Section>

            <Section title="地址" className="md:col-span-2">
              <Row label="完整地址" value={id.fullAddress} />
              <Row label="街道" value={id.street} />
              <Row label="城市" value={id.city} extra={id.region} />
              <Row label="邮编" value={id.zip} extra={id.country} last />
            </Section>

            <Section title="工作" className="md:col-span-2">
              <Row label="公司" value={id.company} />
              <Row label="职业" value={id.occupation} last />
            </Section>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">
          全部数据本地随机生成、不联网；城市·州·邮编为真实组合，姓名 / 门牌 / 电话 / 账号等为虚构拼装。
          仅供开发测试与占位，请勿用于欺诈或伪造身份；出于安全考虑不生成银行卡 / 信用卡号。
        </p>
      </div>
    </ToolShell>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={"overflow-hidden rounded-2xl border border-border bg-card" + (className ? " " + className : "")}>
      <div className="border-b border-border/60 bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  extra,
  last,
}: {
  label: string;
  value: string;
  extra?: string;
  last?: boolean;
}) {
  return (
    <div
      className={
        "flex items-center justify-between gap-3 px-4 py-2.5" +
        (last ? "" : " border-b border-border/50")
      }
    >
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-sm text-foreground">
          {value}
          {extra && <span className="ml-2 text-xs text-muted-foreground">{extra}</span>}
        </div>
      </div>
      <CopyButton value={value} />
    </div>
  );
}
