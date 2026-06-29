"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Select } from "../../components/tools/select";
import { cn } from "../../lib/utils";
import { meta } from "./meta";
import {
  allHashes,
  bruteForceAsync,
  bruteSpace,
  CHARSETS,
  reverseDictionary,
  type HashEntry,
  type ReverseHit,
} from "./lib";

type Mode = "encrypt" | "decrypt";

const CHARSET_OPTS = [
  { value: "digits", label: "纯数字 0-9" },
  { value: "lower", label: "小写字母 a-z" },
  { value: "loweralnum", label: "小写字母 + 数字" },
  { value: "alnum", label: "大小写字母 + 数字" },
];
const LEN_OPTS = [4, 5, 6, 7, 8].map((n) => ({ value: String(n), label: `${n} 位` }));

export default function Md5Ui() {
  const [mode, setMode] = useState<Mode>("encrypt");

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-5">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          {(
            [
              { id: "encrypt", label: "加密" },
              { id: "decrypt", label: "解密 / 反查" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm transition-colors",
                m.id === mode
                  ? "bg-background font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "encrypt" ? <Encrypt /> : <Decrypt />}
      </div>
    </ToolShell>
  );
}

function Encrypt() {
  const [text, setText] = useState("");
  const [salt, setSalt] = useState("");
  const [hashes, setHashes] = useState<HashEntry[]>([]);

  useEffect(() => {
    if (!text) {
      setHashes([]);
      return;
    }
    let cancelled = false;
    allHashes(text, salt).then((h) => {
      if (!cancelled) setHashes(h);
    });
    return () => {
      cancelled = true;
    };
  }, [text, salt]);

  return (
    <div className="space-y-4">
      <ToolField label="原文">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入要加密的文本…"
          rows={3}
          className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm dark:text-foreground"
        />
      </ToolField>

      <ToolField label="加盐（可选，拼接在原文之后）">
        <input
          value={salt}
          onChange={(e) => setSalt(e.target.value)}
          placeholder="salt"
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm dark:text-foreground"
        />
      </ToolField>

      {hashes.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {hashes.map((h, i) => (
            <div
              key={h.label}
              className={
                "flex items-center gap-3 px-3 py-2.5" +
                (i === hashes.length - 1 ? "" : " border-b border-border/50")
              }
            >
              <span className="w-40 shrink-0 text-xs text-muted-foreground">
                {h.label}
              </span>
              <span className="min-w-0 flex-1 break-all font-mono text-sm text-foreground">
                {h.value}
              </span>
              <CopyButton value={h.value} />
            </div>
          ))}
        </div>
      ) : (
        <Hint text="输入文本即可实时生成 MD5 / SHA / NTLM 等多种哈希" />
      )}
    </div>
  );
}

function Decrypt() {
  const [hash, setHash] = useState("");
  const [charset, setCharset] = useState("digits");
  const [maxLen, setMaxLen] = useState("6");
  const [status, setStatus] = useState<
    "idle" | "searching" | "found" | "notfound" | "stopped"
  >("idle");
  const [hit, setHit] = useState<ReverseHit | null>(null);
  const [tried, setTried] = useState(0);
  const stopRef = useRef(false);

  const normalized = hash.trim().toLowerCase();
  const valid = /^[0-9a-f]{32}$/.test(normalized);
  const space = useMemo(
    () => bruteSpace([...CHARSETS[charset]].length, Number(maxLen)),
    [charset, maxLen],
  );

  async function crack() {
    if (!valid) return;
    setStatus("searching");
    setHit(null);
    setTried(0);
    stopRef.current = false;

    // 1) instant dictionary pass
    const dict = reverseDictionary(normalized);
    if (dict) {
      setHit(dict);
      setStatus("found");
      return;
    }
    // 2) bounded, non-blocking brute force
    const res = await bruteForceAsync(normalized, CHARSETS[charset], Number(maxLen), {
      onProgress: setTried,
      shouldStop: () => stopRef.current,
    });
    if (res) {
      setHit(res);
      setStatus("found");
    } else {
      setStatus(stopRef.current ? "stopped" : "notfound");
    }
  }

  return (
    <div className="space-y-4">
      <ToolField label="MD5 值（32 位十六进制）" hint={hash && !valid ? "格式应为 32 位十六进制" : undefined}>
        <input
          value={hash}
          onChange={(e) => {
            setHash(e.target.value);
            setStatus("idle");
          }}
          placeholder="例如 e10adc3949ba59abbe56e057f20f883e"
          className={cn(
            "w-full rounded-md border bg-background px-3 py-2 font-mono text-sm dark:text-foreground",
            hash && !valid ? "border-destructive" : "border-input",
          )}
        />
      </ToolField>

      <div className="grid gap-3 sm:grid-cols-2">
        <ToolField label="暴力破解字符集">
          <Select value={charset} onChange={setCharset} options={CHARSET_OPTS} ariaLabel="字符集" />
        </ToolField>
        <ToolField label="最大长度" hint={`${space.toLocaleString("zh-CN")} 种组合`}>
          <Select value={maxLen} onChange={setMaxLen} options={LEN_OPTS} ariaLabel="最大长度" />
        </ToolField>
      </div>

      <div className="flex items-center gap-2">
        {status === "searching" ? (
          <button
            onClick={() => (stopRef.current = true)}
            className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            停止
          </button>
        ) : (
          <button
            onClick={crack}
            disabled={!valid}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            破解（字典 + 暴力）
          </button>
        )}
        {status === "searching" && (
          <span className="font-mono text-xs text-muted-foreground">
            已尝试 {tried.toLocaleString("zh-CN")} …
          </span>
        )}
      </div>

      {status === "found" && hit && (
        <div className="rounded-xl border border-foreground/20 bg-accent p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              命中（{hit.source === "dictionary" ? "常见密码字典" : "暴力破解"}）
            </span>
            <CopyButton value={hit.plain} />
          </div>
          <div className="mt-1 break-all font-mono text-2xl font-semibold text-foreground">
            {hit.plain}
          </div>
        </div>
      )}
      {status === "notfound" && (
        <Hint text="未在字典与所选暴力范围内找到。可扩大字符集 / 长度再试（更慢）。" />
      )}
      {status === "stopped" && <Hint text="已停止。" />}

      <p className="text-xs leading-relaxed text-muted-foreground">
        MD5 是<strong>单向哈希，无法真正解密</strong>。此处反查为纯本地尽力而为：先比对内置常见弱口令字典，
        再在所选字符集 / 长度内逐个哈希比对（暴力破解）。复杂口令查不到属正常；全程不联网、不上传。
      </p>
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
