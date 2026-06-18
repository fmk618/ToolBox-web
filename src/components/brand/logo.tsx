import type { SVGProps } from "react";
import { cn } from "../../lib/utils";

/**
 * Toolbox letter-mark — a geometric "T" built from two rounded rectangles.
 *
 * `currentColor` is the glyph fill, so it inherits text color from its parent.
 * Use `<LogoMark className="text-white" />` inside a colored container, or
 * `<LogoBadge />` for the brand-tinted background pill used in the topbar/sidebar.
 */
export function LogoMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("h-4 w-4", className)}
      {...props}
    >
      {/* crossbar */}
      <rect x="3.5" y="5" width="17" height="4.5" rx="1.5" fill="currentColor" />
      {/* stem */}
      <rect x="9.75" y="9.5" width="4.5" height="10" rx="1.25" fill="currentColor" />
    </svg>
  );
}

export function LogoBadge({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-[10px] bg-brand text-brand-foreground shadow-[0_1px_2px_rgb(0_0_0/0.08),inset_0_1px_0_rgb(255_255_255/0.18)]",
        className,
      )}
    >
      <LogoMark style={{ width: size * 0.55, height: size * 0.55 }} />
    </div>
  );
}

/** Pure word-mark — "Toolbox" set in Geist Sans with subtle tracking. */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-sans text-[15px] font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      Toolbox
    </span>
  );
}
