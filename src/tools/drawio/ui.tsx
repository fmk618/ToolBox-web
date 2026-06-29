"use client";

import { Download, FileCode, Trash2, Waypoints } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Embeds the open-source draw.io (Apache-2.0) editor via its postMessage embed
// protocol. The diagram is saved to localStorage on this device only — nothing
// is uploaded to our backend. Self-host note: point EMBED_HOST at your own
// drawio image for an air-gapped / SaaS deploy.
const EMBED_HOST = "https://embed.diagrams.net";
const STORAGE_KEY = "toolbox:drawio:xml";

export default function DrawioUi() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [src, setSrc] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark");
    const params = new URLSearchParams({
      embed: "1",
      proto: "json",
      spin: "1",
      libraries: "1",
      noExitBtn: "1",
      ui: dark ? "dark" : "min",
    });
    setSrc(`${EMBED_HOST}/?${params.toString()}`);
  }, []);

  useEffect(() => {
    function post(payload: object) {
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify(payload), "*");
    }
    function onMessage(evt: MessageEvent) {
      if (!iframeRef.current || evt.source !== iframeRef.current.contentWindow) return;
      let msg: { event?: string; xml?: string; data?: string; format?: string };
      try {
        msg = JSON.parse(evt.data);
      } catch {
        return;
      }
      if (msg.event === "init") {
        post({ action: "load", autosave: 1, xml: localStorage.getItem(STORAGE_KEY) ?? "" });
      } else if (msg.event === "autosave" || msg.event === "save") {
        if (typeof msg.xml === "string") {
          localStorage.setItem(STORAGE_KEY, msg.xml);
          setSaved(true);
        }
      } else if (msg.event === "export" && msg.data) {
        download(msg.data, "diagram.png");
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function exportPng() {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: "export", format: "xmlpng" }),
      "*",
    );
  }
  function exportXml() {
    const xml = localStorage.getItem(STORAGE_KEY) ?? "";
    download(
      "data:application/xml;charset=utf-8," + encodeURIComponent(xml),
      "diagram.drawio",
    );
  }
  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: "load", autosave: 1, xml: "" }),
      "*",
    );
    setSaved(false);
  }

  // Full-bleed: bypass the max-w-4xl ToolShell and fill the whole content area.
  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[460px] flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Waypoints className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">流程图 · draw.io</span>
        </div>
        <Btn onClick={exportPng} icon={<Download className="h-4 w-4" />}>
          导出 PNG
        </Btn>
        <Btn onClick={exportXml} icon={<FileCode className="h-4 w-4" />}>
          导出 .drawio
        </Btn>
        <Btn onClick={clearAll} icon={<Trash2 className="h-4 w-4" />}>
          清空
        </Btn>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {saved ? "已自动保存到本地" : "改动自动保存到本地"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {src && (
          <iframe
            ref={iframeRef}
            src={src}
            title="draw.io"
            className="h-full w-full border-0"
          />
        )}
      </div>
    </div>
  );
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

function Btn({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
    >
      {icon}
      {children}
    </button>
  );
}
