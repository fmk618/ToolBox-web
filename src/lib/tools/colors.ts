/**
 * Per-tool accent color: each tool's slug deterministically maps to one of the
 * palette colors. Same slug always returns the same color (stable across reloads).
 *
 * Used by the sidebar dot indicators so tools are visually distinct without
 * relying on backgrounds.
 */
const PALETTE = [
  "#10b981", // emerald
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#d946ef", // fuchsia
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
  "#f43f5e", // rose
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#eab308", // yellow
] as const;

function hashSlug(slug: string): number {
  let h = 5381;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) + h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function toolColor(slug: string): string {
  return PALETTE[hashSlug(slug) % PALETTE.length];
}
