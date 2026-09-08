"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Sparkles, Trophy } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextArea } from "../../components/tools/inputs";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { entriesFromText, secureIndex } from "./lib";

const SAMPLE = "张三\n李四\n王五\n赵六\n陈七\n孙八\n周九\n吴十";

export default function RaffleUi() {
  const [raw, setRaw] = useState(SAMPLE);
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [rolling, setRolling] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const entries = useMemo(() => entriesFromText(raw), [raw]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  function draw() {
    if (rolling || !entries.length) return;
    setRolling(true);
    let shown = entries[secureIndex(entries.length)];
    setWinner(shown);
    timer.current = setInterval(() => {
      shown = entries[secureIndex(entries.length)];
      setWinner(shown);
    }, 70);
    window.setTimeout(() => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
      const chosen = entries[secureIndex(entries.length)];
      setWinner(chosen);
      setHistory((list) => [chosen, ...list].slice(0, 20));
      setRolling(false);
    }, 1400);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          <ToolField label="参与名单" hint={`已识别 ${entries.length} 人；每行一个名字`}>
            <TextArea value={raw} onChange={(e) => setRaw(e.target.value)} rows={14} placeholder="每行输入一位参与者" />
          </ToolField>
          <div className="flex flex-wrap gap-2">
            <Button onClick={draw} disabled={!entries.length || rolling} className="min-w-36">
              {rolling ? <Sparkles className="h-4 w-4 animate-pulse" /> : <Trophy className="h-4 w-4" />}
              {rolling ? "抽取中…" : "开始抽奖"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setWinner(null); setHistory([]); }}><RotateCcw className="h-4 w-4" />重置结果</Button>
            <Button variant="ghost" size="sm" onClick={() => setRaw(SAMPLE)}>填入示例</Button>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-background p-4">
          <div className="text-xs font-medium text-muted-foreground">本次获奖者</div>
          <div className={`grid min-h-32 place-items-center text-center font-semibold transition-all ${rolling ? "scale-105 text-2xl text-brand" : "text-3xl text-foreground"}`}>
            {winner ?? <span className="text-base font-normal text-muted-foreground">等待抽取</span>}
          </div>
          {winner && <div className="flex justify-center"><CopyButton value={winner} /></div>}
          <div className="mt-5 border-t border-border pt-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">抽取记录</div>
            {history.length ? <ol className="space-y-1">{history.map((name, i) => <li key={`${name}-${i}`} className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-sm"><span className="text-muted-foreground">#{history.length - i}</span><span className="font-medium text-foreground">{name}</span></li>)}</ol> : <p className="py-3 text-center text-xs text-muted-foreground">尚无记录</p>}
          </div>
        </aside>
      </div>
      <p className="mt-4 text-center text-[11px] text-muted-foreground">使用浏览器加密随机数抽取；名单和结果均不会上传</p>
    </ToolShell>
  );
}
