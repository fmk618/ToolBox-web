"use client";

import { useEffect, useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextArea } from "../../components/tools/inputs";
import { ErrorBox } from "../../components/tools/error-box";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

function base64UrlDecode(s: string): string {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return decodeURIComponent(escape(atob(s)));
}

type Decoded = {
  header: unknown;
  payload: unknown;
  signature: string;
  err?: string;
};

function decodeJwt(token: string): Decoded {
  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return { header: null, payload: null, signature: "", err: "不是合法的 JWT（需要 3 段以 . 分隔）" };
  }
  try {
    return {
      header: JSON.parse(base64UrlDecode(parts[0])),
      payload: JSON.parse(base64UrlDecode(parts[1])),
      signature: parts[2],
    };
  } catch (e) {
    return {
      header: null,
      payload: null,
      signature: "",
      err: e instanceof Error ? e.message : String(e),
    };
  }
}

function tsFormat(s: unknown): string | null {
  if (typeof s !== "number") return null;
  const ms = s > 1e12 ? s : s * 1000;
  return new Date(ms).toLocaleString();
}

const EXAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export default function JwtDecodeUi() {
  const [input, setInput] = useState(EXAMPLE);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const decoded = useMemo(() => decodeJwt(input), [input]);
  const payload = decoded.payload as Record<string, unknown> | null;

  const exp = tsFormat(payload?.exp);
  const iat = tsFormat(payload?.iat);
  const nbf = tsFormat(payload?.nbf);
  const expired =
    typeof payload?.exp === "number" &&
    (payload.exp as number) * 1000 < now;

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <ToolField label="JWT Token">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            spellCheck={false}
            className="resize-y break-all text-xs"
          />
        </ToolField>

        {decoded.err ? (
          <ErrorBox>{decoded.err}</ErrorBox>
        ) : (
          <>
            {expired && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                ⚠ Token 已过期（exp = {exp}）
              </div>
            )}

            <ToolField
              label="Header"
              action={
                <CopyButton value={JSON.stringify(decoded.header, null, 2)} />
              }
            >
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground">
                {JSON.stringify(decoded.header, null, 2)}
              </pre>
            </ToolField>

            <ToolField
              label="Payload"
              action={
                <CopyButton value={JSON.stringify(decoded.payload, null, 2)} />
              }
            >
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground">
                {JSON.stringify(decoded.payload, null, 2)}
              </pre>
            </ToolField>

            {(iat || nbf || exp) && (
              <ToolField label="时间字段">
                <div className="space-y-1 rounded-lg border border-border bg-background px-3 py-2 text-xs">
                  {iat && (
                    <Row label="iat 签发于" value={iat} />
                  )}
                  {nbf && (
                    <Row label="nbf 生效于" value={nbf} />
                  )}
                  {exp && (
                    <Row
                      label="exp 过期于"
                      value={exp}
                      color={expired ? "text-destructive" : ""}
                    />
                  )}
                </div>
              </ToolField>
            )}

            <ToolField label="签名" action={<CopyButton value={decoded.signature} />}>
              <code className="block break-all rounded-lg border border-border bg-muted px-3 py-2 font-mono text-xs text-foreground">
                {decoded.signature}
              </code>
            </ToolField>

            <p className="text-[11px] text-muted-foreground">
              本工具仅解码 Header / Payload，不进行签名校验。生产环境请使用 jose 等库做完整 verify。
            </p>
          </>
        )}
      </div>
    </ToolShell>
  );
}

function Row({
  label,
  value,
  color = "",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${color || "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
