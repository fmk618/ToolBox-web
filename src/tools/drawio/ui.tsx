"use client";

import { Download, FileCode, Trash2, Waypoints } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { downloadDataUrl, downloadText } from "../../lib/download";

// Uses the upstream editor's embed protocol. The diagram is saved on this device only;
// the iframe host is configurable so deployments can point to a self-hosted instance.
const EMBED_HOST = process.env.NEXT_PUBLIC_DRAWIO_EMBED_HOST ?? "https://embed.diagrams.net";
const STORAGE_KEY = "toolbox:drawio:xml";
const MAX_XML_LENGTH = 20 * 1024 * 1024;
const MAX_EXPORT_LENGTH = 50 * 1024 * 1024;

type EmbedMessage = {
  event?: unknown;
  xml?: unknown;
  data?: unknown;
};

function embedUrl(): string {
  const url = new URL(EMBED_HOST, window.location.origin);
  const dark = document.documentElement.classList.contains("dark");
  url.search = new URLSearchParams({
    embed: "1",
    proto: "json",
    spin: "1",
    libraries: "1",
    noExitBtn: "1",
    offline: "1",
    ui: dark ? "dark" : "min",
  }).toString();
  return url.toString();
}

function embedOrigin(): string {
  return new URL(EMBED_HOST, window.location.origin).origin;
}

function parseMessage(data: unknown): EmbedMessage | null {
  if (typeof data !== "string" || data.length > MAX_EXPORT_LENGTH) return null;
  try {
    const message: unknown = JSON.parse(data);
    if (!message || typeof message !== "object") return null;
    return message as EmbedMessage;
  } catch {
    return null;
  }
}

function readXml(): string {
  const xml = localStorage.getItem(STORAGE_KEY) ?? "";
  return xml.length <= MAX_XML_LENGTH ? xml : "";
}

export default function DrawioUi() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [src] = useState(() => (typeof window === "undefined" ? "" : embedUrl()));
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    function post(payload: object) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify(payload),
        embedOrigin(),
      );
    }

    function onMessage(evt: MessageEvent) {
      if (
        !iframeRef.current ||
        evt.origin !== embedOrigin() ||
        evt.source !== iframeRef.current.contentWindow
      ) return;

      const message = parseMessage(evt.data);
      if (!message || typeof message.event !== "string") return;

      if (message.event === "init") {
        post({ action: "load", autosave: 1, xml: readXml() });
        setReady(true);
      } else if (message.event === "autosave" || message.event === "save") {
        if (typeof message.xml === "string" && message.xml.length <= MAX_XML_LENGTH) {
          localStorage.setItem(STORAGE_KEY, message.xml);
          setSaved(true);
        }
      } else if (
        message.event === "export" &&
        typeof message.data === "string" &&
        message.data.startsWith("data:image/") &&
        message.data.length <= MAX_EXPORT_LENGTH
      ) {
        downloadDataUrl(message.data, "flowchart.png");
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function exportPng() {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: "export", format: "xmlpng" }),
      embedOrigin(),
    );
  }

  function exportXml() {
    downloadText(readXml(), "flowchart.xml", "application/xml;charset=utf-8");
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ action: "load", autosave: 1, xml: "" }),
      embedOrigin(),
    );
    setSaved(false);
  }

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[460px] flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="mr-1 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-foreground">
            <Waypoints className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">流程图编辑器</span>
        </div>
        <Btn onClick={exportPng} icon={<Download className="h-4 w-4" />} disabled={!ready}>
          导出 PNG
        </Btn>
        <Btn onClick={exportXml} icon={<FileCode className="h-4 w-4" />} disabled={!ready}>
          导出 XML
        </Btn>
        <Btn onClick={clearAll} icon={<Trash2 className="h-4 w-4" />} disabled={!ready}>
          清空
        </Btn>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">
          {loadError ? "编辑器加载失败，请检查网络或自托管配置" : saved ? "已自动保存到本地" : "改动自动保存到本地"}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card">
        {src && (
          <iframe
            ref={iframeRef}
            src={src}
            title="流程图编辑器"
            referrerPolicy="no-referrer"
            className="h-full w-full border-0"
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      <p className="text-center text-[11px] leading-5 text-muted-foreground">
        图表会发送到当前配置的编辑器主机进行编辑；配置自托管地址后可在本机部署。编辑器的开源许可、版权和归属信息见项目第三方许可清单。
      </p>
    </div>
  );
}

function Btn({
  onClick,
  icon,
  children,
  disabled = false,
}: {
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {children}
    </button>
  );
}
