import type { ReactNode } from "react";

export function StepSection({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-950">
      <header className="mb-4 flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          {hint && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
