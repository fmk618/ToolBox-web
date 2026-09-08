"use client";

import { useMemo, useState } from "react";
import { CaseUpper, Sparkles } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextArea } from "../../components/tools/inputs";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import { meta } from "./meta";
import { formatSql } from "./lib";

const SAMPLE = "select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.active=true and o.created_at >= '2026-01-01' group by u.id,u.name order by orders desc limit 20;";

export default function SqlFormatUi() {
  const [input, setInput] = useState(SAMPLE);
  const [uppercase, setUppercase] = useState(true);
  const deferred = useDebouncedValue(input, 150);
  const result = useMemo(() => {
    try { return { value: formatSql(deferred, uppercase), error: "" }; }
    catch (e) { return { value: "", error: e instanceof Error ? e.message : "格式化失败" }; }
  }, [deferred, uppercase]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} className="h-4 w-4 accent-foreground" /><CaseUpper className="h-4 w-4" />关键字大写</label>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => setInput(SAMPLE)}><Sparkles className="h-4 w-4" />填入示例</Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ToolField label="SQL 输入"><TextArea value={input} onChange={(e) => setInput(e.target.value)} rows={21} placeholder="SELECT * FROM users" /></ToolField>
          <div className="space-y-1.5"><div className="flex items-baseline justify-between"><span className="text-xs font-medium text-muted-foreground">格式化结果</span><CopyButton value={result.value} /></div>{result.error ? <ErrorBox>{result.error}</ErrorBox> : <TextArea value={result.value} readOnly rows={21} className="bg-muted" />}</div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">支持 SELECT、INSERT、UPDATE、DELETE 等常见语句；不会执行或上传 SQL。</p>
      </div>
    </ToolShell>
  );
}
