"use client";

import { Copy, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { buildUtmUrl, EMPTY_UTM, type UtmParams } from "./lib";
import { meta } from "./meta";

const FIELDS: readonly { key: keyof UtmParams; label: string; placeholder: string }[] = [
  { key: "source", label: "来源（source）", placeholder: "newsletter" },
  { key: "medium", label: "媒介（medium）", placeholder: "email" },
  { key: "campaign", label: "活动（campaign）", placeholder: "spring-sale" },
  { key: "term", label: "关键词（term）", placeholder: "running-shoes" },
  { key: "content", label: "内容（content）", placeholder: "hero-button" },
];

export default function UtmBuilderUi() {
  const [base, setBase] = useState("https://example.com/landing");
  const [params, setParams] = useState<UtmParams>(EMPTY_UTM);
  const result = useMemo(() => {
    try {
      return { value: buildUtmUrl(base, params), error: "" };
    } catch (error) {
      return { value: "", error: error instanceof Error ? error.message : "链接生成失败" };
    }
  }, [base, params]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <ToolField label="基础网址" hint="只在本地拼接，不会请求网址">
            <TextField value={base} onChange={(event) => setBase(event.target.value)} placeholder="https://example.com/page" inputMode="url" />
          </ToolField>
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">使用提示</div>
            <p className="mt-1 leading-6">填写活动参数后，可复制完整链接粘贴到广告、邮件或社交媒体中。</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((field) => (
            <ToolField key={field.key} label={field.label}>
              <TextField value={params[field.key]} onChange={(event) => setParams((current) => ({ ...current, [field.key]: event.target.value }))} placeholder={field.placeholder} />
            </ToolField>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => { setBase("https://example.com/landing"); setParams({ source: "newsletter", medium: "email", campaign: "spring-sale", term: "", content: "hero-button" }); }}>
            <Copy className="h-4 w-4" /> 填入示例
          </Button>
          <Button variant="ghost" onClick={() => { setBase(""); setParams(EMPTY_UTM); }}>
            <RotateCcw className="h-3.5 w-3.5" /> 清空
          </Button>
        </div>
        {result.error ? <ErrorBox>{result.error}</ErrorBox> : (
          <section className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-foreground">生成结果</h2>
              <CopyButton value={result.value} />
            </div>
            <code className="block break-all rounded-lg bg-background p-3 text-sm leading-6 text-foreground">{result.value || "填写基础网址后显示结果"}</code>
          </section>
        )}
      </div>
    </ToolShell>
  );
}
