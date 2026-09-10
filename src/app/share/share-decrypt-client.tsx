"use client";

import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import {
  decryptProtectedFragment,
  isWebCryptoAvailable,
} from "../../lib/secure-qr-share";

function subscribeToHashChange(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

function getHash() {
  return window.location.hash.slice(1);
}

function getServerHash() {
  return "";
}

function subscribeToNothing() {
  return () => {};
}

function getSecureContext() {
  return isWebCryptoAvailable();
}

function getServerSecureContext() {
  return true;
}

export default function ShareDecryptClient() {
  const hash = useSyncExternalStore(
    subscribeToHashChange,
    getHash,
    getServerHash,
  );
  const supportsCrypto = useSyncExternalStore(
    subscribeToNothing,
    getSecureContext,
    getServerSecureContext,
  );
  const [encryptedFragment, setEncryptedFragment] = useState("");
  const [password, setPassword] = useState("");
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hash || encryptedFragment) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    const capture = window.setTimeout(() => setEncryptedFragment(hash), 0);
    return () => window.clearTimeout(capture);
  }, [encryptedFragment, hash]);

  useEffect(() => {
    const clearSensitiveState = () => {
      setPassword("");
      setPlaintext(null);
      setError("");
    };
    window.addEventListener("pagehide", clearSensitiveState);
    return () => {
      window.removeEventListener("pagehide", clearSensitiveState);
    };
  }, []);

  async function unlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!encryptedFragment || loading) return;

    setLoading(true);
    setError("");
    setPlaintext(null);
    try {
      const value = await decryptProtectedFragment(encryptedFragment, password);
      setPlaintext(value);
    } catch {
      setError("密码错误或链接已损坏。");
    } finally {
      setPassword("");
      setLoading(false);
    }
  }

  function lock() {
    setPassword("");
    setPlaintext(null);
    setError("");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/35 px-5 py-5 sm:px-7">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
              <LockKeyhole className="size-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-foreground">密码保护分享</h1>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                内容仅在你的浏览器中解密，不会上传到 FMKTools 服务器。
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-7">
          {!encryptedFragment ? (
            <EmptyState />
          ) : !supportsCrypto ? (
            <CryptoUnavailable />
          ) : plaintext === null ? (
            <form className="space-y-4" onSubmit={unlock}>
              <div>
                <label
                  htmlFor="share-password"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  分享密码
                </label>
                <input
                  id="share-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  required
                  disabled={loading}
                  placeholder="请输入发送方通过另一渠道告知的密码"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
              {error && <ErrorBox>{error}</ErrorBox>}
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
                {loading ? "正在解锁…" : "解锁内容"}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                请向发送方单独索取密码。关闭或刷新此页面后，已解锁内容不会被保存。
              </p>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldCheck className="size-4 text-green-600 dark:text-green-400" />
                内容已在本地解锁
              </div>
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-muted/35 p-4 font-sans text-sm leading-6 text-foreground">
                {plaintext}
              </pre>
              <div className="flex flex-wrap gap-2">
                <CopyButton value={plaintext} />
                <Button variant="outline" onClick={lock}>
                  <LockKeyhole className="size-4" />
                  锁定并清除内容
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">未找到加密分享内容</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        请使用完整的 FMKTools 密码分享链接或二维码打开此页面。
      </p>
    </div>
  );
}

function CryptoUnavailable() {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="font-medium text-foreground">当前环境无法安全解密</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        需要 HTTPS 和浏览器 Web Crypto 支持。若你正通过微信打开，请使用右上角菜单选择“在浏览器打开”后重试；不会降级加密或上传内容。
      </p>
    </div>
  );
}
