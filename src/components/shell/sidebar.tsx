"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronRight, Clock, Search, Star, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CATEGORIES } from "../../lib/tools/categories";
import { TOOLS, searchTools } from "../../lib/tools/manifest";
import { useJobs } from "../../lib/jobs";
import type { ToolMeta } from "../../lib/tools/types";
import { toolColor } from "../../lib/tools/colors";
import { LogoBadge, LogoWordmark } from "../brand/logo";
import { cn } from "../../lib/utils";
import { useFavorites, toggleFavorite } from "../../lib/favorites";
import { useRecents, removeRecent } from "../../lib/recents";

export function Sidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const params = useParams<{ slug?: string }>();
  const activeSlug = params?.slug;
  const { activeCount } = useJobs();
  const [query, setQuery] = useState("");
  const favorites = useFavorites();
  const recents = useRecents();

  const visible = useMemo(() => searchTools(query), [query]);
  const visibleByCat = useMemo(() => {
    const m = new Map<string, ToolMeta[]>();
    for (const t of visible) {
      if (!m.has(t.category)) m.set(t.category, []);
      m.get(t.category)!.push(t);
    }
    return m;
  }, [visible]);

  const favTools = useMemo(
    () => favorites.map((s) => TOOLS.find((t) => t.slug === s)).filter((t): t is ToolMeta => t !== undefined),
    [favorites],
  );
  const recentTools = useMemo(
    () => recents.map((s) => TOOLS.find((t) => t.slug === s)).filter((t): t is ToolMeta => t !== undefined),
    [recents],
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-background">
      {/* Sticky header: logo + search share one bottom border */}
      <div className="shrink-0 border-b border-border">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 px-5 py-4 transition-colors hover:bg-muted/40"
        >
          <LogoBadge size={36} />
          <LogoWordmark />
        </Link>
        <div className="px-2 pb-2">
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
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {!query && (
          <>
            <PinnedSection
              label="收藏"
              icon={Star}
              tools={favTools}
              activeSlug={activeSlug}
              favorites={favorites}
              onNavigate={onNavigate}
              activeCount={activeCount}
            />
            <PinnedSection
              label="最近使用"
              icon={Clock}
              tools={recentTools}
              activeSlug={activeSlug}
              favorites={favorites}
              onNavigate={onNavigate}
              activeCount={activeCount}
              showRemove
            />
          </>
        )}

        {CATEGORIES.filter((c) => visibleByCat.has(c.id)).map((cat) => (
          <CategoryGroup
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            tools={visibleByCat.get(cat.id) ?? []}
            activeSlug={activeSlug}
            favorites={favorites}
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
    </aside>
  );
}

// ── PinnedSection (收藏 / 最近使用) ──────────────────────────────────────────
function PinnedSection({
  label,
  icon: Icon,
  tools,
  activeSlug,
  favorites,
  onNavigate,
  activeCount,
  showRemove,
}: {
  label: string;
  icon: LucideIcon;
  tools: ToolMeta[];
  activeSlug?: string;
  favorites: string[];
  onNavigate?: () => void;
  activeCount: number;
  showRemove?: boolean;
}) {
  if (tools.length === 0) return null;
  return (
    <div className="mt-2 first:mt-0">
      <div className="flex items-center gap-2 px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="mt-0.5">
        {tools.map((t, i) => (
          <ToolItem
            key={t.slug}
            tool={t}
            active={t.slug === activeSlug}
            activeCount={activeCount}
            onNavigate={onNavigate}
            isFirst={i === 0}
            isLast={i === tools.length - 1}
            isFavorite={favorites.includes(t.slug)}
            onRemove={showRemove ? () => removeRecent(t.slug) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

// ── CategoryGroup ─────────────────────────────────────────────────────────
function CategoryGroup({
  label,
  icon: Icon,
  tools,
  activeSlug,
  favorites,
  forceOpen,
  onNavigate,
  activeCount,
}: {
  label: string;
  icon: LucideIcon;
  tools: ToolMeta[];
  activeSlug?: string;
  favorites: string[];
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
            {tools.map((t, i) => (
              <ToolItem
                key={t.slug}
                tool={t}
                active={t.slug === activeSlug}
                activeCount={activeCount}
                onNavigate={onNavigate}
                isFirst={i === 0}
                isLast={i === tools.length - 1}
                isFavorite={favorites.includes(t.slug)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── ToolItem ──────────────────────────────────────────────────────────────
function ToolItem({
  tool: t,
  active,
  activeCount,
  onNavigate,
  isFirst,
  isLast,
  isFavorite,
  onRemove,
}: {
  tool: ToolMeta;
  active: boolean;
  activeCount: number;
  onNavigate?: () => void;
  isFirst: boolean;
  isLast: boolean;
  isFavorite: boolean;
  onRemove?: () => void;
}) {
  const color = toolColor(t.slug);
  const TIcon = t.icon;
  const showBadge = t.slug === "file-convert" && activeCount > 0;

  return (
    <div className="group/item relative flex items-center">
      <Link
        href={`/tools/${t.slug}`}
        onClick={onNavigate}
        className={cn(
          "group relative flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pl-4 pr-7 text-[13px] outline-none transition-[color,font-weight] duration-200",
          active
            ? "font-semibold"
            : "font-normal text-muted-foreground hover:text-foreground",
        )}
        style={active ? { color } : undefined}
      >
        {/* Connector line segments */}
        {!isFirst && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-[22px] top-0 h-1/2 w-px bg-border"
          />
        )}
        {!isLast && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-[22px] h-1/2 w-px bg-border"
          />
        )}

        {/* Color dot */}
        <span className="relative z-10 grid h-3 w-3 shrink-0 place-items-center">
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
            active ? "" : "text-muted-foreground/80 group-hover:text-foreground",
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

      {/* Action button: X for recents, star for favorites/categories */}
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          aria-label="从最近使用中移除"
          className="absolute right-1 top-1/2 -translate-y-1/2 grid h-5 w-5 place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(t.slug);
          }}
          aria-label={isFavorite ? "取消收藏" : "收藏"}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 grid h-5 w-5 place-items-center rounded text-muted-foreground transition-opacity",
            isFavorite
              ? "opacity-100 text-amber-400"
              : "opacity-0 group-hover/item:opacity-100 hover:text-foreground",
          )}
        >
          <Star
            className={cn("h-3 w-3", isFavorite && "fill-amber-400 text-amber-400")}
          />
        </button>
      )}
    </div>
  );
}
