"use client";

import { useEffect, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleX,
  Cpu,
} from "lucide-react";
import { fetchEngines, type EngineInfo } from "../../lib/api";
import { fmtMeta } from "../../lib/formats";

const ENGINE_META: Record<
  string,
  { license: string; about: string; install: string }
> = {
  "vision-llm": {
    license: "云服务",
    about:
      "云端视觉大模型，逐页「看」PDF 输出 Markdown —— 表格、标题、页眉页脚、复杂版式都能识别。质量最高，按 token 计费。支持 DeepSeek / 通义千问 / OpenAI 等 provider 切换。",
    install:
      "在「设置」页选 provider、模型、填 API Key 即可启用；未配置时 PDF→MD 自动回退到 Docling",
  },
  docling: {
    license: "MIT",
    about:
      "IBM 出品本地 ML 引擎。识别标题/表格/列表，PDF→Markdown 高质量。首次启动加载模型 ~30-60s，之后每次转换 5-30s。",
    install: "已随 Python 包自动安装（PyTorch + ML 模型 ~500MB）",
  },
  markitdown: {
    license: "MIT",
    about:
      "Microsoft 开源轻量工具，任意格式 → Markdown，秒级速度。PDF 仅做文本抽取（不识别结构），适合简单 PDF / 非 PDF 输入。",
    install: "已随 Python 包自动安装",
  },
  pandoc: {
    license: "GPL-2.0+",
    about: "Markdown 与各种文档格式之间互转的事实标准。子进程调用。",
    install: "brew install pandoc",
  },
  libreoffice: {
    license: "MPL-2.0",
    about: "Office 文档 → PDF 的最稳路径，子进程方式调用。",
    install: "brew install --cask libreoffice",
  },
};

export default function EnginesPage() {
  const [engines, setEngines] = useState<EngineInfo[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchEngines()
      .then((data) => {
        setEngines(data);
        setErr(null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          正在检测引擎…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {err}
        </div>
      </div>
    );
  }

  const available = engines.filter((e) => e.available).length;

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="总引擎" value={engines.length} icon={Boxes} />
        <Stat label="可用" value={available} icon={CheckCircle2} color="text-green-600" />
        <Stat
          label="未安装"
          value={engines.length - available}
          icon={CircleX}
          color={engines.length - available > 0 ? "text-amber-600" : "text-slate-400"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        {engines.map((e) => (
          <EngineCard key={e.name} engine={e} />
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  color = "text-slate-900 dark:text-slate-100",
}: {
  label: string;
  value: number;
  icon: typeof Boxes;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
          {label}
        </div>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className={`mt-1 text-xl font-semibold sm:text-2xl ${color}`}>
        {value}
      </div>
    </div>
  );
}

function EngineCard({ engine }: { engine: EngineInfo }) {
  const meta = ENGINE_META[engine.name];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800">
            <Cpu className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {engine.name}
              </h3>
              {meta && (
                <span className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {meta.license}
                </span>
              )}
            </div>
            {meta && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {meta.about}
              </p>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {engine.available ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3" />
              已可用
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <CircleX className="h-3 w-3" />
              未安装
            </span>
          )}
        </div>
      </div>

      {!engine.available && meta && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          安装命令：<code className="rounded bg-amber-100 px-1.5 py-px font-mono dark:bg-amber-900">{meta.install}</code>
        </div>
      )}

      {engine.available && engine.active_provider && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          <span className="font-medium">当前 Provider：</span>
          {engine.active_provider.label} ·{" "}
          <code className="rounded bg-blue-100 px-1.5 py-px font-mono dark:bg-blue-900">
            {engine.active_provider.model}
          </code>
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-slate-400">
          支持的转换 ({engine.edges.length})
        </div>
        <div className="flex flex-wrap gap-1.5">
          {engine.edges.map(([from, to]) => {
            const a = fmtMeta(from);
            const b = fmtMeta(to);
            return (
              <span
                key={`${from}-${to}`}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                <span className={a.color}>{a.label}</span>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <span className={b.color}>{b.label}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
