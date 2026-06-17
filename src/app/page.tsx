"use client";

import Link from "next/link";
import { CATEGORIES, categoryById } from "../lib/tools/categories";
import { TOOLS } from "../lib/tools/manifest";

export default function HomePage() {
  const grouped = new Map<string, typeof TOOLS>();
  for (const t of TOOLS) {
    if (!grouped.has(t.category)) grouped.set(t.category, []);
    grouped.get(t.category)!.push(t);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Toolbox
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          常用开发者小工具集合，全部本地运行，无需登录
        </p>
      </header>

      {CATEGORIES.filter((c) => grouped.has(c.id)).map((cat) => {
        const Icon = cat.icon;
        const tools = grouped.get(cat.id) ?? [];
        return (
          <section key={cat.id} className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-400">{tools.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => {
                const TIcon = t.icon;
                return (
                  <Link
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-700"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-300">
                      <TIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {t.name}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {t.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Suppress unused-warning helper kept for future use.
void categoryById;
