"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search, Wrench } from "lucide-react";
import { CATEGORIES } from "../../lib/tools/categories";
import { TOOLS, searchTools } from "../../lib/tools/manifest";
import { useJobs } from "../../lib/jobs";
import type { Tool } from "../../lib/tools/types";

export function Sidebar({
  backendOk,
  onNavigate,
}: {
  backendOk: boolean | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const activeSlug = params?.slug;
  const { activeCount } = useJobs();
  const [query, setQuery] = useState("");

  const visible = useMemo(() => searchTools(query), [query]);
  const visibleByCat = useMemo(() => {
    const m = new Map<string, Tool[]>();
    for (const t of visible) {
      if (!m.has(t.category)) m.set(t.category, []);
      m.get(t.category)!.push(t);
    }
    return m;
  }, [visible]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800"
      >
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <Wrench className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Toolbox
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            {TOOLS.length} tools
          </div>
        </div>
      </Link>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具…"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {CATEGORIES.filter((c) => visibleByCat.has(c.id)).map((cat) => (
          <CategoryGroup
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            tools={visibleByCat.get(cat.id) ?? []}
            activeSlug={activeSlug}
            forceOpen={!!query}
            onNavigate={onNavigate}
            activeCount={activeCount}
          />
        ))}
        {visible.length === 0 && (
          <div className="px-3 py-6 text-center text-xs text-slate-400">
            没有匹配的工具
          </div>
        )}
      </nav>

      <div className="border-t border-slate-200 px-4 py-3 text-xs dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              backendOk === null
                ? "bg-slate-300"
                : backendOk
                  ? "bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.2)]"
                  : "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.2)]"
            }`}
          />
          <span className="text-slate-600 dark:text-slate-400">
            {backendOk === null
              ? "正在检查后端"
              : backendOk
                ? "后端已连接"
                : "后端未连接"}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400">
          {pathname === "/" ? "首页" : `/${pathname.split("/").pop()}`}
        </div>
      </div>
    </aside>
  );
}

function CategoryGroup({
  label,
  icon: Icon,
  tools,
  activeSlug,
  forceOpen,
  onNavigate,
  activeCount,
}: {
  label: string;
  icon: import("lucide-react").LucideIcon;
  tools: Tool[];
  activeSlug?: string;
  forceOpen: boolean;
  onNavigate?: () => void;
  activeCount: number;
}) {
  const [open, setOpen] = useState(true);
  const isOpen = forceOpen || open;

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Icon className="h-3 w-3" />
        <span>{label}</span>
        <span className="ml-auto text-slate-400">{tools.length}</span>
      </button>
      {isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {tools.map((t) => {
            const active = t.slug === activeSlug;
            const TIcon = t.icon;
            const showBadge = t.slug === "file-convert" && activeCount > 0;
            return (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                onClick={onNavigate}
                className={`group flex items-center justify-between gap-2 rounded-md py-1.5 pl-7 pr-2 text-sm transition ${
                  active
                    ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <TIcon
                    className={`h-3.5 w-3.5 shrink-0 ${
                      active
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400"
                    }`}
                  />
                  <span className="truncate">{t.name}</span>
                </span>
                {showBadge && (
                  <span className="rounded-full bg-blue-600 px-1.5 py-px text-[10px] font-semibold text-white">
                    {activeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
