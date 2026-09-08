"use client";

import { useRef, useState } from "react";
import { Crosshair, Upload } from "lucide-react";
import { ToolShell } from "../../components/tools/tool-shell";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";
import { dominantColors, toHex, type Rgb } from "./lib";

export default function ImagePaletteUi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageName, setImageName] = useState("");
  const [picked, setPicked] = useState<Rgb | null>(null);
  const [colors, setColors] = useState<Rgb[]>([]);
  const [count, setCount] = useState(6);

  function load(files: File[]) {
    const file = files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const max = 1600;
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = canvasRef.current!;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0, width, height);
      setColors(dominantColors(ctx.getImageData(0, 0, width, height).data, count));
      setPicked(null);
      setImageName(file.name);
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  function pick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height)));
    const pixel = canvas.getContext("2d", { willReadFrequently: true })!.getImageData(x, y, 1, 1).data;
    setPicked([pixel[0], pixel[1], pixel[2]]);
  }

  function refreshPalette(nextCount: number) {
    setCount(nextCount);
    const canvas = canvasRef.current;
    if (!canvas?.width) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    setColors(dominantColors(ctx.getImageData(0, 0, canvas.width, canvas.height).data, nextCount));
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        {!imageName ? (
          <FileDropZone
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
            onFiles={load}
            title="拖入一张图片，或"
            hint="图片仅在本地分析，不会上传 · 支持 PNG / JPG / WebP / GIF / BMP"
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3">
              <span className="truncate text-sm text-foreground">{imageName}</span>
              <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                主色数量
                <input type="range" min="3" max="12" value={count} onChange={(e) => refreshPalette(Number(e.target.value))} className="w-24 accent-foreground" />
                <span className="w-4 text-right">{count}</span>
              </label>
              <Button variant="outline" size="sm" onClick={() => { setImageName(""); setColors([]); setPicked(null); }}><Upload className="h-4 w-4" />换一张</Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
                <canvas
                  ref={canvasRef}
                  onClick={pick}
                  title="点击图片任意位置取色"
                  className="block max-h-[34rem] w-full cursor-crosshair object-contain"
                />
              </div>
              <aside className="space-y-4">
                <section>
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Crosshair className="h-4 w-4" />精确取色</h2>
                  {picked ? <ColorCard color={picked} large /> : <Empty>点击左侧图片取色</Empty>}
                </section>
                <section>
                  <h2 className="mb-2 text-xs font-medium text-muted-foreground">自动主色</h2>
                  <div className="space-y-2">{colors.map((color) => <ColorCard key={toHex(color)} color={color} />)}</div>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function ColorCard({ color, large = false }: { color: Rgb; large?: boolean }) {
  const hex = toHex(color);
  const [r, g, b] = color;
  return (
    <div className={`flex items-center gap-2 rounded-lg border border-border bg-background p-2 ${large ? "p-3" : ""}`}>
      <span className={`shrink-0 rounded-md border border-black/10 ${large ? "h-14 w-14" : "h-9 w-9"}`} style={{ backgroundColor: hex }} />
      <div className="min-w-0"><div className="font-mono text-sm font-medium text-foreground">{hex}</div><div className="text-[11px] text-muted-foreground">rgb({r}, {g}, {b})</div></div>
      <div className="ml-auto"><CopyButton value={hex} /></div>
    </div>
  );
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">{children}</div>;
}
