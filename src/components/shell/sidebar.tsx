"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Boxes,
  History as HistoryIcon,
  ListChecks,
  Settings,
  Wrench,
} from "lucide-react";
import { useJobs } from "../../lib/jobs";

const NAV = [
  { href: "/", label: "转换", icon: ArrowLeftRight, key: "convert" },
  { href: "/queue", label: "任务队列", icon: ListChecks, key: "queue", badge: true },
  { href: "/history", label: "历史记录", icon: HistoryIcon, key: "history" },
  { href: "/engines", label: "引擎状态", icon: Boxes, key: "engines" },
  { href: "/settings", label: "设置", icon: Settings, key: "settings" },
] as const;

export function Sidebar({
  backendOk,
  onNavigate,
}: {
  backendOk: boolean | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { activeCount } = useJobs();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <Wrench className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Toolbox
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            File Convert Suite
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          const showBadge = item.badge && activeCount > 0;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 ${
                    active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                  }`}
                />
                {item.label}
              </span>
              {showBadge && (
                <span className="rounded-full bg-blue-600 px-1.5 py-px text-[10px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </Link>
          );
        })}
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
        <div className="mt-1 truncate text-[10px] text-slate-400">v0.1.0</div>
      </div>
    </aside>
  );
}
