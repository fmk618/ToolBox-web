import type { ReactNode } from "react";

export function StepSection({
  step,
  title,
  hint,
  children,
}: {
  step: number;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-6">
      <header className="mb-4 flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">
            {title}
          </h2>
          {hint && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}
