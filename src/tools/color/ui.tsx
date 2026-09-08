"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextField } from "../../components/tools/inputs";
import { ErrorBox } from "../../components/tools/error-box";
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
            className="h-16 w-20 cursor-pointer rounded-lg border border-border"
          />
          <div
            className="h-16 flex-1 rounded-lg border border-border"
            style={{ background: data?.preview ?? "transparent" }}
          />
        </div>

        <ToolField label="Hex">
          <TextField
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#3b82f6"
            className="font-mono text-sm"
          />
        </ToolField>

        {data ? (
          <>
            <ToolField label="RGB" action={<CopyButton value={data.rgbStr} />}>
              <TextField readOnly value={data.rgbStr} className="bg-muted font-mono text-sm" />
            </ToolField>
            <ToolField label="HSL" action={<CopyButton value={data.hslStr} />}>
              <TextField readOnly value={data.hslStr} className="bg-muted font-mono text-sm" />
            </ToolField>
          </>
        ) : (
          <ErrorBox>不是有效的 Hex 颜色</ErrorBox>
        )}
      </div>
    </ToolShell>
  );
}
