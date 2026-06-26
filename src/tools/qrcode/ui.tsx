"use client";

import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { meta } from "./meta";

const LEVELS = ["L", "M", "Q", "H"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_DESC: Record<Level, string> = {
  L: "L · 容错 7%",
  M: "M · 容错 15%",
  Q: "Q · 容错 25%",
  H: "H · 容错 30%（推荐含 logo 时）",
};

export default function QrcodeUi() {
  const [text, setText] = useState("https://github.com/fmk618/ToolBox");
  const [level, setLevel] = useState<Level>("M");
  const [size, setSize] = useState(256);
  const [dataUrl, setDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!text || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, text, {
      width: size,
      errorCorrectionLevel: level,
      margin: 2,
    })
      .then(() => {
        if (canvasRef.current) setDataUrl(canvasRef.current.toDataURL("image/png"));
      })
      .catch(() => setDataUrl(""));
  }, [text, level, size]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    a.click();
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <ToolField label="内容">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="文本、URL、WIFI:T:WPA;S:SSID;P:password;;"
          />
        </ToolField>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToolField label="纠错级别">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Level)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_DESC[l]}
                </option>
              ))}
            </select>
          </ToolField>
          <ToolField label={`尺寸 ${size}×${size}`}>
            <input
              type="range"
              min={128}
              max={512}
              step={32}
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              className="w-full"
            />
          </ToolField>
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <canvas ref={canvasRef} />
          <button
            onClick={download}
            disabled={!dataUrl}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> 下载 PNG
          </button>
        </div>
      </div>
    </ToolShell>
  );
}
