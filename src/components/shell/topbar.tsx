"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ChevronRight, HelpCircle, Menu, RefreshCw } from "lucide-react";
import { getTool } from "../../lib/tools/manifest";

export function Topbar({
  onRefresh,
  onMenuClick,
}: {
  onRefresh?: () => void;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const tool = params?.slug ? getTool(params.slug) : undefined;

  const isHome = pathname === "/";
  const title = isHome ? "所有工具" : (tool?.name ?? "未知工具");

  return (
    <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-6 sm:py-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-w-0 items-start gap-2 sm:gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            aria-label="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <nav className="hidden items-center gap-1 text-xs text-slate-400 sm:flex">
            <Link href="/" className="hover:text-slate-600 dark:hover:text-slate-300">
              Toolbox
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600 dark:text-slate-300">{title}</span>
          </nav>
          <h1 className="truncate text-base font-semibold text-slate-900 sm:mt-1 sm:text-lg dark:text-slate-50">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="刷新"
            aria-label="刷新"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        <a
          href="https://github.com/fmk618/ToolBox"
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
          title="GitHub"
          aria-label="GitHub"
        >
          <HelpCircle className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
