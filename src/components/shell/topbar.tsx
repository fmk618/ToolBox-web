"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, HelpCircle, Menu, RefreshCw } from "lucide-react";

const PATH_LABELS: Record<string, string> = {
  "/": "新建转换",
  "/queue": "任务队列",
  "/history": "历史记录",
  "/engines": "引擎状态",
  "/settings": "设置",
};

const PATH_DESC: Record<string, string> = {
  "/": "选择源格式与目标格式，拖入文件后批量入队转换",
  "/queue": "实时查看进行中、已完成与失败任务",
  "/history": "本地保留最近 50 次转换记录",
  "/engines": "检测引擎可用性及支持范围",
  "/settings": "后端地址、主题、历史保留",
};

export function Topbar({
  onRefresh,
  onMenuClick,
}: {
  onRefresh?: () => void;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const title = PATH_LABELS[pathname] ?? "未知页面";
  const desc = PATH_DESC[pathname] ?? "";

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <nav className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
            <span>Toolbox</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 dark:text-slate-300">{title}</span>
          </nav>
          <h1 className="truncate text-base font-semibold text-slate-900 sm:mt-1 sm:text-xl dark:text-slate-50">
            {title}
          </h1>
          {desc && (
            <p className="mt-0.5 hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
              {desc}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            title="刷新"
            aria-label="刷新"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <a
          href="https://github.com/microsoft/markitdown"
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          title="帮助"
          aria-label="帮助"
        >
          <HelpCircle className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
