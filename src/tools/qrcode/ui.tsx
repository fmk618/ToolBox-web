"use client";

import { Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { Select } from "../../components/tools/select";
import { TextArea } from "../../components/tools/inputs";
import { Button } from "../../components/tools/button";
import { meta } from "./meta";

const LEVELS = ["L", "M", "Q", "H"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_DESC: Record<Level, string> = {
  L: "L · 容错 7%",
  M: "M · 容错 15%",
  Q: "Q · 容错 25%",
  H: "H · 容错 30%（推荐含 logo 时）",
};

const LEVEL_OPTIONS = LEVELS.map((l) => ({ value: l, label: LEVEL_DESC[l] }));

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
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="resize-y"
            placeholder="文本、URL、WIFI:T:WPA;S:SSID;P:password;;"
          />
        </ToolField>

        <div className="grid gap-3 sm:grid-cols-2">
          <ToolField label="纠错级别">
            <Select
              value={level}
              onChange={(v) => setLevel(v as Level)}
              options={LEVEL_OPTIONS}
              className="w-full"
            />
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

        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-6">
          <canvas ref={canvasRef} />
          <Button onClick={download} disabled={!dataUrl} className="gap-2">
            <Download className="h-4 w-4" /> 下载 PNG
          </Button>
        </div>
      </div>
    </ToolShell>
  );
}
