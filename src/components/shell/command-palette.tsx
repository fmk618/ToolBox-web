"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Clock, Search, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES, categoryById } from "../../lib/tools/categories";
import { TOOLS } from "../../lib/tools/manifest";
import { useRecents } from "../../lib/recents";
import { cn } from "../../lib/utils";
import type { Tool } from "../../lib/tools/types";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
};

const CommandPaletteCtx = React.createContext<Ctx | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ open, setOpen, toggle: () => setOpen((o) => !o) }),
    [open],
  );

  return (
    <CommandPaletteCtx.Provider value={value}>
      {children}
      <CommandPalette />
    </CommandPaletteCtx.Provider>
  );
}

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteCtx);
  if (!ctx) throw new Error("useCommandPalette must be inside CommandPaletteProvider");
  return ctx;
}

function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const recentSlugs = useRecents();

  const recentTools = React.useMemo(
    () => recentSlugs.map((s) => TOOLS.find((t) => t.slug === s)).filter((t): t is Tool => t !== undefined),
    [recentSlugs],
  );

  function go(slug: string) {
    setOpen(false);
    router.push(`/tools/${slug}`);
  }

  function goHome() {
    setOpen(false);
    router.push("/");
  }

  // Group tools by category for the palette body.
  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof TOOLS>();
    for (const t of TOOLS) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    return map;
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -4 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-1/2 top-[18%] z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
              >
                <Dialog.Title className="sr-only">命令面板</Dialog.Title>
                <Dialog.Description className="sr-only">
                  按工具名、关键字或描述搜索，回车跳转
                </Dialog.Description>

                <Command
                  label="命令面板"
                  filter={(value, search) => {
                    if (!search) return 1;
                    return value.toLowerCase().includes(search.toLowerCase())
                      ? 1
                      : 0;
                  }}
                >
                  <div className="flex items-center gap-2 border-b border-border px-3 py-3">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Command.Input
                      autoFocus
                      placeholder="搜索工具…"
                      onValueChange={setSearch}
                      className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
                    />
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      ESC
                    </kbd>
                  </div>

                  <Command.List className="max-h-[60vh] overflow-y-auto p-2">
                    <Command.Empty className="px-4 py-8 text-center text-sm text-muted-foreground">
                      没有匹配的工具
                    </Command.Empty>

                    {/* Recents — shown only when search is empty */}
                    {!search && recentTools.length > 0 && (
                      <Command.Group
                        heading={<PaletteHeading icon={Clock} text="最近使用" />}
                        className="text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                      >
                        {recentTools.slice(0, 5).map((t) => (
                          <PaletteItem
                            key={t.slug}
                            value={`recent ${t.name} ${t.slug}`}
                            onSelect={() => go(t.slug)}
                            icon={t.icon}
                            title={t.name}
                            subtitle={t.description}
                          />
                        ))}
                      </Command.Group>
                    )}

                    {/* Home shortcut */}
                    <Command.Group
                      heading={
                        <PaletteHeading icon={Sparkles} text="导航" />
                      }
                      className="text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                    >
                      <PaletteItem
                        value="home 首页 home"
                        onSelect={goHome}
                        title="所有工具"
                        subtitle="返回首页，浏览全部分类"
                      />
                    </Command.Group>

                    {CATEGORIES.filter((c) => grouped.has(c.id)).map((cat) => {
                      const list = grouped.get(cat.id) ?? [];
                      return (
                        <Command.Group
                          key={cat.id}
                          heading={
                            <PaletteHeading
                              icon={categoryById(cat.id)?.icon ?? Sparkles}
                              text={cat.label}
                            />
                          }
                          className="text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:pt-3"
                        >
                          {list.map((t) => (
                            <PaletteItem
                              key={t.slug}
                              value={`${t.name} ${t.slug} ${
                                t.description
                              } ${(t.keywords ?? []).join(" ")}`}
                              onSelect={() => go(t.slug)}
                              icon={t.icon}
                              title={t.name}
                              subtitle={t.description}
                            />
                          ))}
                        </Command.Group>
                      );
                    })}
                  </Command.List>

                  <div className="flex items-center justify-between border-t border-border bg-muted/40 px-3 py-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <kbd className="rounded border border-border bg-background px-1 py-px font-mono">
                        ↑↓
                      </kbd>
                      <span>导航</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="rounded border border-border bg-background px-1 py-px font-mono">
                        ↵
                      </kbd>
                      <span>打开</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="rounded border border-border bg-background px-1 py-px font-mono">
                        ⌘ K
                      </kbd>
                      <span>关闭</span>
                    </div>
                  </div>
                </Command>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function PaletteHeading({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="flex items-center gap-1.5 uppercase tracking-[0.08em]">
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}

function PaletteItem({
  value,
  onSelect,
  icon: Icon,
  title,
  subtitle,
}: {
  value: string;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm",
        "transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground",
      )}
    >
      {Icon && (
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground">{title}</div>
        {subtitle && (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        )}
      </div>
    </Command.Item>
  );
}
