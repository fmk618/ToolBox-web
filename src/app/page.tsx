"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CATEGORIES } from "../lib/tools/categories";
import { TOOLS } from "../lib/tools/manifest";

export default function HomePage() {
  const grouped = new Map<string, typeof TOOLS>();
  for (const t of TOOLS) {
    if (!grouped.has(t.category)) grouped.set(t.category, []);
    grouped.get(t.category)!.push(t);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <motion.header
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Toolbox
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          常用开发者小工具集合，全部本地运行 · 按{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-px font-mono text-[10px]">
            ⌘ K
          </kbd>{" "}
          快速搜索
        </p>
      </motion.header>

      {CATEGORIES.filter((c) => grouped.has(c.id)).map((cat, catIdx) => {
        const Icon = cat.icon;
        const tools = grouped.get(cat.id) ?? [];
        return (
          <section key={cat.id} className="mb-10">
            <motion.div
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.06 * catIdx + 0.05 }}
              className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="text-muted-foreground/70">{tools.length}</span>
            </motion.div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t, i) => {
                const TIcon = t.icon;
                return (
                  <motion.div
                    key={t.slug}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: 0.06 * catIdx + 0.02 * i + 0.08,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <Link
                      href={`/tools/${t.slug}`}
                      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:border-brand/50 hover:bg-accent hover:shadow-[0_2px_8px_-2px_rgb(0_0_0/0.08)]"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                        <TIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-card-foreground">
                          {t.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {t.description}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
