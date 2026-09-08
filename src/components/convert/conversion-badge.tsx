import { ArrowRight } from "lucide-react";
import { fmtMeta } from "../../lib/formats";

export function ConversionBadge({ src, dst }: { src: string; dst: string }) {
  const a = fmtMeta(src);
  const b = fmtMeta(dst);
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm">
      <span className={`font-medium ${a.color}`}>{a.label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      <span className={`font-medium ${b.color}`}>{b.label}</span>
    </div>
  );
}
