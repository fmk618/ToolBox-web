"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORIES } from "../../lib/tools/categories";
import { TOOLS, searchTools } from "../../lib/tools/manifest";
import { useJobs } from "../../lib/jobs";
import type { Tool } from "../../lib/tools/types";
import { toolColor } from "../../lib/tools/colors";
import { LogoBadge, LogoWordmark } from "../brand/logo";
import { cn } from "../../lib/utils";

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
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2.5 border-b border-border px-5 py-4 transition-colors hover:bg-muted/40"
      >
        <LogoBadge size={36} />
        <LogoWordmark />
      </Link>

      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具…"
            className="w-full rounded-md border border-input bg-muted/50 py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:bg-background focus:outline-none"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
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
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            没有匹配的工具
          </div>
        )}
      </nav>

      <div className="border-t border-border px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 rounded-full transition-colors",
              backendOk === null
                ? "bg-muted-foreground/40"
                : backendOk
                  ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                  : "bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.18)]",
            )}
          />
          <span className="text-muted-foreground">
            {backendOk === null
              ? "正在检查后端"
              : backendOk
                ? "后端已连接"
                : "后端未连接"}
          </span>
        </div>
        <div className="mt-1 truncate text-[10px] text-muted-foreground/70">
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
  icon: LucideIcon;
  tools: Tool[];
  activeSlug?: string;
  forceOpen: boolean;
  onNavigate?: () => void;
  activeCount: number;
}) {
  const [open, setOpen] = useState(true);
  const isOpen = forceOpen || open;

  return (
    <div className="mt-2 first:mt-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        <span className="truncate">{label}</span>
        <span className="ml-auto rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tracking-normal text-muted-foreground transition-colors group-hover:bg-background">
          {tools.length}
        </span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
            isOpen && "rotate-90",
          )}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        aria-hidden={!isOpen}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              "mt-0.5 transition-opacity duration-200",
              isOpen ? "opacity-100" : "opacity-0",
            )}
          >
            {tools.map((t) => (
              <ToolItem
                key={t.slug}
                tool={t}
                active={t.slug === activeSlug}
                activeCount={activeCount}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolItem({
  tool: t,
  active,
  activeCount,
  onNavigate,
}: {
  tool: Tool;
  active: boolean;
  activeCount: number;
  onNavigate?: () => void;
}) {
  const color = toolColor(t.slug);
  const TIcon = t.icon;
  const showBadge = t.slug === "file-convert" && activeCount > 0;

  return (
    <Link
      href={`/tools/${t.slug}`}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 py-1.5 pl-4 pr-2 text-[13px] outline-none transition-[color,font-weight] duration-200",
        active
          ? "font-semibold"
          : "font-normal text-muted-foreground hover:text-foreground",
      )}
      style={active ? { color } : undefined}
    >
      {/* Color dot — replaces the old continuous border-l guide */}
      <span className="relative grid h-3 w-3 shrink-0 place-items-center">
        <span
          aria-hidden
          className={cn(
            "rounded-full transition-all duration-200 ease-out",
            active
              ? "h-2 w-2"
              : "h-1.5 w-1.5 opacity-75 group-hover:h-2 group-hover:w-2 group-hover:opacity-100",
          )}
          style={{
            backgroundColor: color,
            boxShadow: active
              ? `0 0 0 4px ${color}26, 0 0 8px 0 ${color}55`
              : undefined,
          }}
        />
      </span>

      <TIcon
        className={cn(
          "h-3.5 w-3.5 shrink-0 transition-colors duration-200",
          active
            ? ""
            : "text-muted-foreground/80 group-hover:text-foreground",
        )}
        style={active ? { color } : undefined}
      />

      <span className="truncate">{t.name}</span>

      {showBadge && (
        <span
          className="ml-auto rounded-full px-1.5 py-px text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {activeCount}
        </span>
      )}
    </Link>
  );
}
