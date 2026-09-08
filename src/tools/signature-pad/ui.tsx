"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eraser, PenLine } from "lucide-react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { Button } from "../../components/tools/button";
import { Select } from "../../components/tools/select";
import { TextField } from "../../components/tools/inputs";
import { downloadDataUrl } from "../../lib/download";
import { meta } from "./meta";

const WIDTH = 1200;
const HEIGHT = 420;

type Ink = "#111827" | "#1e3a8a" | "#7f1d1d";

export default function SignaturePadUi() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [ink, setInk] = useState<Ink>("#111827");
  const [lineWidth, setLineWidth] = useState(5);
  const [hasInk, setHasInk] = useState(false);
  const [filename, setFilename] = useState("signature");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d")!;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * WIDTH, y: ((e.clientY - rect.top) / rect.height) * HEIGHT };
  }

  function begin(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const current = point(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = ink;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
    last.current = current;
    setHasInk(true);
  }

  function finish() {
    drawing.current = false;
    last.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, WIDTH, HEIGHT);
    setHasInk(false);
  }

  function exportImage(kind: "png" | "jpeg") {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    let source = canvas;
    if (kind === "jpeg") {
      source = document.createElement("canvas");
      source.width = WIDTH;
      source.height = HEIGHT;
      const ctx = source.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.drawImage(canvas, 0, 0);
    }
    downloadDataUrl(
      source.toDataURL(`image/${kind}`, kind === "jpeg" ? 0.95 : undefined),
      `${filename.trim() || "signature"}.${kind === "jpeg" ? "jpg" : "png"}`,
    );
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-background p-3">
          <div className="w-40"><ToolField label="墨水颜色"><Select value={ink} onChange={(v) => setInk(v as Ink)} options={[
            { value: "#111827", label: "深黑" }, { value: "#1e3a8a", label: "深蓝" }, { value: "#7f1d1d", label: "深红" },
          ]} /></ToolField></div>
          <div className="w-36"><ToolField label={`笔画粗细 · ${lineWidth}px`}><input type="range" min="2" max="16" value={lineWidth} onChange={(e) => setLineWidth(Number(e.target.value))} className="mt-2 w-full accent-foreground" /></ToolField></div>
          <div className="w-44"><ToolField label="文件名"><TextField value={filename} onChange={(e) => setFilename(e.target.value)} /></ToolField></div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={clear} disabled={!hasInk}><Eraser className="h-4 w-4" />清空</Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="flex items-center gap-2 border-b border-border bg-muted px-3 py-2 text-xs text-muted-foreground"><PenLine className="h-4 w-4" />在下方签名区域按住鼠标或手指书写</div>
          <canvas
            ref={canvasRef}
            aria-label="电子签名画布"
            onPointerDown={begin}
            onPointerMove={draw}
            onPointerUp={finish}
            onPointerCancel={finish}
            onPointerLeave={finish}
            className="block h-auto w-full touch-none cursor-crosshair bg-white"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => exportImage("jpeg")} disabled={!hasInk}><Download className="h-4 w-4" />下载白底 JPG</Button>
          <Button size="sm" onClick={() => exportImage("png")} disabled={!hasInk}><Download className="h-4 w-4" />下载透明 PNG</Button>
        </div>
      </div>
    </ToolShell>
  );
}
