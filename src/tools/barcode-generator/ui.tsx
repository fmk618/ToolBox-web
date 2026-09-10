"use client";

import JsBarcode from "jsbarcode";
import { Download, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/tools/button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextField } from "../../components/tools/inputs";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadDataUrl, downloadText } from "../../lib/download";
import { validateBarcode } from "./lib";
import { meta } from "./meta";

const FORMATS = [
  { value: "CODE128", label: "CODE128" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC", label: "UPC" },
  { value: "CODE39", label: "CODE39" },
] as const;

export default function BarcodeGeneratorUi() {
  const [value, setValue] = useState("FMKTOOLS-2026");
  const [format, setFormat] = useState("CODE128");
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const error = validateBarcode(value, format);
  useEffect(() => {
    if (!svgRef.current || !canvasRef.current) return;
    svgRef.current.replaceChildren();
    const context = canvasRef.current.getContext("2d");
    context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (error) return;
    const options = { format, width: 2, height: 100, displayValue: true, margin: 12, background: "#ffffff", lineColor: "#111827" };
    JsBarcode(svgRef.current, value.trim(), options);
    JsBarcode(canvasRef.current, value.trim(), options);
  }, [error, format, value]);
  function downloadSvg() { if (svgRef.current && !error) downloadText(`<?xml version="1.0" encoding="UTF-8"?>\n${svgRef.current.outerHTML}`, "barcode.svg", "image/svg+xml;charset=utf-8"); }
  function downloadPng() { if (canvasRef.current && !error) downloadDataUrl(canvasRef.current.toDataURL("image/png"), "barcode.png"); }
  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <ToolField label="条形码内容"><TextField value={value} onChange={(event) => setValue(event.target.value)} spellCheck={false} /></ToolField>
          <ToolField label="格式"><select value={format} onChange={(event) => setFormat(event.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30">{FORMATS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></ToolField>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <section className="overflow-auto rounded-xl border border-border bg-white p-5"><div className="flex min-h-40 min-w-[22rem] items-center justify-center"><svg ref={svgRef} aria-label="条形码预览" /></div><canvas ref={canvasRef} className="hidden" /></section>
        <div className="flex flex-wrap items-center gap-2"><Button onClick={downloadSvg} disabled={!value || !!error}><Download className="h-4 w-4" />下载 SVG</Button><Button variant="outline" onClick={downloadPng} disabled={!value || !!error}><Download className="h-4 w-4" />下载 PNG</Button><Button variant="ghost" onClick={() => setValue("")}><RotateCcw className="h-3.5 w-3.5" /> 清空</Button></div>
        <p className="text-center text-[11px] leading-5 text-muted-foreground">条形码在浏览器本地生成。EAN-13、EAN-8 和 UPC 需要符合对应的数字长度与校验规则。</p>
      </div>
    </ToolShell>
  );
}
