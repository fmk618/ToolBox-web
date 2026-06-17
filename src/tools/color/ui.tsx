"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { hexToRgb, rgbToHex, rgbToHsl } from "./lib";

export default function ColorUi() {
  const [hex, setHex] = useState("#3b82f6");

  const data = useMemo(() => {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const [r, g, b] = rgb;
    const [h, s, l] = rgbToHsl(r, g, b);
    return {
      hex: rgbToHex(r, g, b),
      rgbStr: `rgb(${r}, ${g}, ${b})`,
      hslStr: `hsl(${h}, ${s}%, ${l}%)`,
      preview: `rgb(${r}, ${g}, ${b})`,
    };
  }, [hex]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={data?.hex ?? "#3b82f6"}
            onChange={(e) => setHex(e.target.value)}
            className="h-16 w-20 cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700"
          />
          <div
            className="h-16 flex-1 rounded-lg border border-slate-200 dark:border-slate-700"
            style={{ background: data?.preview ?? "transparent" }}
          />
        </div>

        <ToolField label="Hex">
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#3b82f6"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </ToolField>

        {data ? (
          <>
            <ToolField label="RGB" action={<CopyButton value={data.rgbStr} />}>
              <input
                readOnly
                value={data.rgbStr}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </ToolField>
            <ToolField label="HSL" action={<CopyButton value={data.hslStr} />}>
              <input
                readOnly
                value={data.hslStr}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </ToolField>
          </>
        ) : (
          <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            不是有效的 Hex 颜色
          </div>
        )}
      </div>
    </ToolShell>
  );
}
