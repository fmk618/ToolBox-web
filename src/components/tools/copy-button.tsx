"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** 剪贴板写入，带 execCommand 降级（非 HTTPS / 老浏览器）。 */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      disabled={!value}
      onClick={async () => {
        if (!value) return;
        if (await copyText(value)) {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }
      }}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" /> 已复制
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" /> 复制
        </>
      )}
    </button>
  );
}
