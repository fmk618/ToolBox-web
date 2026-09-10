"use client";

import { Download, Loader2, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea, TextField } from "../../components/tools/inputs";
import { Select } from "../../components/tools/select";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import {
  createProtectedFragment,
  getSecureShareBaseUrl,
  isWebCryptoAvailable,
  SECURE_QR_MAX_PLAINTEXT_BYTES,
  SECURE_QR_MIN_PASSWORD_LENGTH,
  SecureQrShareError,
  utf8ByteLength,
} from "../../lib/secure-qr-share";
import { cn } from "../../lib/utils";
import { meta } from "./meta";

const LEVELS = ["L", "M", "Q", "H"] as const;
type Level = (typeof LEVELS)[number];
type Mode = "standard" | "protected";

type RenderState = {
  key: string;
  dataUrl: string;
  error: string;
  version: number;
  modules: number;
  pixels: number;
};

const QR_MARGIN = 4;
const QR_MIN_DOWNLOAD_SIZE = 768;
const MAX_PROTECTED_QR_VERSION = 17;

const LEVEL_DESC: Record<Level, string> = {
  L: "L · 容错 7%",
  M: "M · 容错 15%",
  Q: "Q · 容错 25%",
  H: "H · 容错 30%（推荐含 logo 时）",
};

const LEVEL_OPTIONS = LEVELS.map((level) => ({
  value: level,
  label: LEVEL_DESC[level],
}));

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function qrErrorMessage(): string {
  return "内容过长，无法生成二维码。请缩短内容后重试。";
}

export default function QrcodeUi() {
  const [mode, setMode] = useState<Mode>("standard");
  const [text, setText] = useState("https://github.com/fmk618/ToolBox");
  const [level, setLevel] = useState<Level>("M");
  const [previewSize, setPreviewSize] = useState(288);
  const [protectedText, setProtectedText] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [protectedUrl, setProtectedUrl] = useState("");
  const [protectedError, setProtectedError] = useState("");
  const [creatingProtectedUrl, setCreatingProtectedUrl] = useState(false);
  const [renderState, setRenderState] = useState<RenderState | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRevision = useRef(0);

  const { url: shareBaseUrl, error: shareBaseError } = getSecureShareBaseUrl();
  const content = mode === "standard" ? text.trim() : protectedUrl;
  const errorCorrectionLevel: Level = mode === "protected" ? "M" : level;
  const renderKey = `${mode}\u0000${content}\u0000${errorCorrectionLevel}`;
  const currentRender = renderState?.key === renderKey ? renderState : null;
  const contentBytes = utf8ByteLength(protectedText);
  const standardInputIsHttps = useMemo(() => isHttpsUrl(text.trim()), [text]);

  useEffect(() => {
    const revision = ++renderRevision.current;
    const canvas = canvasRef.current;
    if (!canvas || !content) return;
    const targetCanvas: HTMLCanvasElement = canvas;

    async function render() {
      try {
        const code = QRCode.create(content, { errorCorrectionLevel });
        if (mode === "protected" && code.version > MAX_PROTECTED_QR_VERSION) {
          if (renderRevision.current === revision) {
            setRenderState({
              key: renderKey,
              dataUrl: "",
              error: "加密分享内容过长，请缩短内容后重试。",
              version: code.version,
              modules: code.modules.size,
              pixels: 0,
            });
          }
          return;
        }

        const pixels = Math.max(
          QR_MIN_DOWNLOAD_SIZE,
          (code.modules.size + QR_MARGIN * 2) * 8,
        );
        const outputCanvas = document.createElement("canvas");
        await QRCode.toCanvas(outputCanvas, content, {
          width: pixels,
          errorCorrectionLevel,
          margin: QR_MARGIN,
          color: { dark: "#000000", light: "#ffffff" },
        });
        if (renderRevision.current !== revision) return;
        targetCanvas.width = outputCanvas.width;
        targetCanvas.height = outputCanvas.height;
        const context = targetCanvas.getContext("2d");
        if (!context) throw new Error("canvas unavailable");
        context.drawImage(outputCanvas, 0, 0);
        setRenderState({
          key: renderKey,
          dataUrl: outputCanvas.toDataURL("image/png"),
          error: "",
          version: code.version,
          modules: code.modules.size,
          pixels,
        });
      } catch {
        if (renderRevision.current !== revision) return;
        setRenderState({
          key: renderKey,
          dataUrl: "",
          error: qrErrorMessage(),
          version: 0,
          modules: 0,
          pixels: 0,
        });
      }
    }

    void render();
    return () => {
      if (renderRevision.current === revision) renderRevision.current += 1;
    };
  }, [content, errorCorrectionLevel, mode, renderKey]);

  async function createProtectedUrl() {
    if (creatingProtectedUrl) return;
    setProtectedError("");
    setProtectedUrl("");

    if (!isWebCryptoAvailable()) {
      setProtectedError("当前环境不支持安全的本地加密。请在 HTTPS 页面或现代浏览器中使用此功能。");
      return;
    }
    if (!shareBaseUrl) {
      setProtectedError(shareBaseError ?? "未配置公开分享地址。");
      return;
    }
    if (password !== passwordConfirmation) {
      setProtectedError("两次输入的密码不一致。");
      return;
    }

    setCreatingProtectedUrl(true);
    try {
      const fragment = await createProtectedFragment(protectedText, password);
      const url = `${shareBaseUrl}#${fragment}`;
      const code = QRCode.create(url, { errorCorrectionLevel: "M" });
      if (code.version > MAX_PROTECTED_QR_VERSION) {
        throw new SecureQrShareError("加密分享内容过长，请缩短内容后重试。");
      }
      setProtectedUrl(url);
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      setProtectedError(
        error instanceof SecureQrShareError ? error.message : qrErrorMessage(),
      );
    } finally {
      setCreatingProtectedUrl(false);
    }
  }

  function download() {
    if (!currentRender?.dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = currentRender.dataUrl;
    anchor.download = mode === "protected" ? "fmktools-private-share.png" : "fmktools-qrcode.png";
    anchor.click();
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
          {(
            [
              { id: "standard", label: "普通二维码", icon: QrCode },
              { id: "protected", label: "密码分享", icon: LockKeyhole },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                disabled={creatingProtectedUrl}
                onClick={() => setMode(item.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors disabled:cursor-wait disabled:opacity-60",
                  mode === item.id
                    ? "bg-background font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {mode === "standard" ? (
          <div className="space-y-4">
            <ToolField label="内容">
              <TextArea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
                className="resize-y"
                placeholder="文本、https://example.com、WIFI:T:WPA;S:SSID;P:password;;"
              />
            </ToolField>
            {text.trim() && !standardInputIsHttps && (
              <p className="text-xs leading-5 text-muted-foreground">
                当前内容会作为普通文本编码。微信通常只会将标准 HTTPS 链接识别为可直接打开的网页。
              </p>
            )}
            <ToolField label="纠错级别">
              <Select
                value={level}
                onChange={(value) => setLevel(value as Level)}
                options={LEVEL_OPTIONS}
                className="w-full"
              />
            </ToolField>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-foreground/15 bg-accent p-4">
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                <p className="text-sm leading-6 text-foreground">
                  二维码将编码为可被微信识别的 HTTPS 链接。接收方打开后，必须输入你通过另一渠道发送的密码，内容才会在对方浏览器本地解密。
                </p>
              </div>
            </div>

            <ToolField
              label={`需要保护的内容（${contentBytes}/${SECURE_QR_MAX_PLAINTEXT_BYTES} 字节）`}
              hint="支持中文、emoji 和换行；内容及密码均不会上传或保存。"
            >
              <TextArea
                value={protectedText}
                disabled={creatingProtectedUrl}
                onChange={(event) => {
                  setProtectedText(event.target.value);
                  setProtectedUrl("");
                  setProtectedError("");
                }}
                rows={4}
                className="resize-y"
                placeholder="输入需要通过密码查看的内容"
              />
            </ToolField>

            <div className="grid gap-3 sm:grid-cols-2">
              <ToolField label={`分享密码（至少 ${SECURE_QR_MIN_PASSWORD_LENGTH} 个字符）`}>
                <TextField
                  type="password"
                  value={password}
                  disabled={creatingProtectedUrl}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setProtectedUrl("");
                    setProtectedError("");
                  }}
                  autoComplete="new-password"
                  placeholder="请使用强密码"
                />
              </ToolField>
              <ToolField label="确认密码">
                <TextField
                  type="password"
                  value={passwordConfirmation}
                  disabled={creatingProtectedUrl}
                  onChange={(event) => {
                    setPasswordConfirmation(event.target.value);
                    setProtectedUrl("");
                    setProtectedError("");
                  }}
                  autoComplete="new-password"
                  placeholder="再次输入密码"
                />
              </ToolField>
            </div>

            {shareBaseError && <ErrorBox>{shareBaseError}</ErrorBox>}
            {protectedError && <ErrorBox>{protectedError}</ErrorBox>}
            {contentBytes > SECURE_QR_MAX_PLAINTEXT_BYTES && (
              <ErrorBox>内容超过 {SECURE_QR_MAX_PLAINTEXT_BYTES} 字节，无法生成密码分享二维码。</ErrorBox>
            )}

            <Button
              type="button"
              onClick={createProtectedUrl}
              disabled={
                creatingProtectedUrl ||
                !protectedText ||
                !password ||
                !passwordConfirmation ||
                contentBytes > SECURE_QR_MAX_PLAINTEXT_BYTES ||
                !shareBaseUrl
              }
            >
              {creatingProtectedUrl ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
              {creatingProtectedUrl ? "正在加密…" : "生成密码分享二维码"}
            </Button>

            {protectedUrl && (
              <ToolField label="分享链接" hint="二维码中不含密码；请通过另一渠道将密码告知接收方。">
                <div className="space-y-2">
                  <TextArea value={protectedUrl} readOnly rows={3} className="resize-none text-xs" />
                  <CopyButton value={protectedUrl} />
                </div>
              </ToolField>
            )}
            {process.env.NODE_ENV === "development" && shareBaseUrl && (
              <p className="text-xs leading-5 text-amber-700 dark:text-amber-400">
                当前为开发地址，仅供本机调试；部署后请在构建时配置公开 HTTPS 地址。
              </p>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_15rem] sm:items-end">
          <ToolField label={`预览尺寸 ${previewSize}×${previewSize}`} hint="下载 PNG 至少 768px，保证每个模块至少 8 个物理像素。">
            <input
              type="range"
              min={192}
              max={512}
              step={32}
              value={previewSize}
              onChange={(event) => setPreviewSize(Number(event.target.value))}
              className="w-full accent-foreground"
            />
          </ToolField>
          {currentRender && !currentRender.error && (
            <p className="pb-1 text-xs text-muted-foreground">
              版本 {currentRender.version} · {currentRender.modules}×{currentRender.modules} 模块 · PNG {currentRender.pixels}px
            </p>
          )}
        </div>

        {currentRender?.error && <ErrorBox>{currentRender.error}</ErrorBox>}

        <div className="flex min-h-[21rem] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-background p-6">
          {content && !currentRender && (
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="正在生成二维码" />
          )}
          {!content && (
            <p className="text-sm text-muted-foreground">
              {mode === "protected" ? "填写内容和密码后生成分享二维码" : "输入内容后生成二维码"}
            </p>
          )}
          <canvas
            ref={canvasRef}
            className={cn(
              "max-w-full rounded-sm bg-white [image-rendering:pixelated]",
              !currentRender?.dataUrl && "hidden",
            )}
            style={{ width: previewSize, height: previewSize }}
          />
          <Button onClick={download} disabled={!currentRender?.dataUrl}>
            <Download className="size-4" />
            下载 PNG
          </Button>
        </div>
      </div>
    </ToolShell>
  );
}
