import { ArrowRight } from "lucide-react";
import { fmtMeta } from "../../lib/formats";

export function ConversionBadge({ src, dst }: { src: string; dst: string }) {
  const a = fmtMeta(src);
  const b = fmtMeta(dst);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm dark:border-slate-700 dark:bg-slate-800">
      <span className={`font-medium ${a.color}`}>{a.label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
      <span className={`font-medium ${b.color}`}>{b.label}</span>
    </div>
  );
}
