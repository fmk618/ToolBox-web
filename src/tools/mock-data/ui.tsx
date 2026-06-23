"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { meta } from "./meta";

// ── data tables ────────────────────────────────────────────────────────────
const CN_SURNAMES = "赵钱孙李周吴郑王冯陈楚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎".split("");
const CN_CHARS    = "伟芳娜秀英华慧巧美娟艺文静明建青先鸣乐志勇浩丽淑民诚良萍凤彩玉梅桂娥彬鹏磊刚涛晖超亮".split("");
const EN_FIRST    = ["Alice","Bob","Charlie","Diana","Evan","Fiona","Grace","Henry","Isla","Jack","Kate","Liam","Mia","Noah","Olivia","Paul","Quinn","Rachel","Sam","Tina"];
const EN_LAST     = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Lee","Walker","Hall"];
const EMAIL_HOSTS = ["gmail.com","outlook.com","qq.com","163.com","yeah.net","foxmail.com","icloud.com"];
const PHONE_PRE   = ["130","131","132","133","134","135","136","137","138","139","150","151","152","153","155","156","157","158","159","176","177","178","180","181","182","183","185","186","187","188","189"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDigits(n: number) { return Array.from({ length: n }, () => randInt(0, 9)).join(""); }
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function cnName()    { return rand(CN_SURNAMES) + rand(CN_CHARS) + (Math.random() > 0.6 ? rand(CN_CHARS) : ""); }
function enName()    { return `${rand(EN_FIRST)} ${rand(EN_LAST)}`; }
function phone()     { return rand(PHONE_PRE) + randDigits(8); }
function email()     {
  const user = rand(EN_FIRST).toLowerCase() + randInt(10, 999);
  return `${user}@${rand(EMAIL_HOSTS)}`;
}
function randDate(from = 1980, to = 2010) {
  const y = randInt(from, to);
  const m = String(randInt(1, 12)).padStart(2, "0");
  const d = String(randInt(1, 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function randNum(min = 1, max = 10000) { return String(randInt(min, max)); }

// ── type definitions ────────────────────────────────────────────────────────
const TYPES = [
  { key: "cn-name",  label: "中文姓名", gen: cnName },
  { key: "en-name",  label: "英文姓名", gen: enName },
  { key: "phone",    label: "手机号",   gen: phone },
  { key: "email",    label: "邮箱",     gen: email },
  { key: "uuid",     label: "UUID",     gen: uuid },
  { key: "date",     label: "日期",     gen: () => randDate() },
  { key: "number",   label: "随机数",   gen: () => randNum() },
] as const;

type TypeKey = typeof TYPES[number]["key"];

// ── component ──────────────────────────────────────────────────────────────
export default function MockDataUi() {
  const [selected, setSelected] = useState<TypeKey>("cn-name");
  const [count, setCount] = useState(10);
  const [results, setResults] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const typeObj = TYPES.find((t) => t.key === selected)!;

  function generate() {
    setResults(Array.from({ length: count }, () => typeObj.gen()));
  }

  async function copyAll() {
    await navigator.clipboard.writeText(results.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        {/* Type selector */}
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">数据类型</div>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelected(t.key)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected === t.key
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count + Generate */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">数量</span>
            <input
              type="number"
              min={1}
              max={200}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value))))}
              className="w-20 rounded-md border border-input bg-muted/50 px-2 py-1.5 text-center text-sm focus:border-ring focus:outline-none"
            />
          </div>
          <button
            onClick={generate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            生成
          </button>
          {results.length > 0 && (
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "已复制" : "复制全部"}
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-muted/30">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border/50 px-3 py-2 last:border-0 hover:bg-muted/50"
              >
                <span className="font-mono text-sm">{r}</span>
                <button
                  onClick={async () => { await navigator.clipboard.writeText(r); }}
                  className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                  title="复制"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ToolShell>
  );
}
