"use client";

import { Download, KeyRound, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { TextArea } from "../../components/tools/inputs";
import { Select } from "../../components/tools/select";
import { ToolField, ToolShell } from "../../components/tools/tool-shell";
import { downloadText } from "../../lib/download";
import {
  generateRsaKeyPair,
  RSA_KEY_SIZES,
  type RsaKeyPairPem,
  type RsaKeySize,
} from "./lib";
import { meta } from "./meta";

const SIZE_OPTIONS = RSA_KEY_SIZES.map((size) => ({
  value: String(size),
  label: `${size} 位`,
}));

export default function RsaKeypairUi() {
  const [size, setSize] = useState<RsaKeySize>(2048);
  const [keys, setKeys] = useState<RsaKeyPairPem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setKeys(null);
    try {
      setKeys(await generateRsaKeyPair(size));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "RSA 密钥生成失败。");
    } finally {
      setBusy(false);
    }
  }

  function clear() {
    setKeys(null);
    setError(null);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-5">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 text-xs leading-5 text-amber-800 dark:text-amber-300">
          RSA-OAEP / SHA-256 密钥在当前浏览器内生成。私钥只保留在当前页面内存中，不会上传、保存到本地存储或写入 URL；请仅在可信环境中下载私钥。
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-muted/20 p-3">
          <div className="w-36">
            <ToolField label="密钥长度">
              <Select
                value={String(size)}
                onChange={(value) => {
                  setSize(Number(value) as RsaKeySize);
                  setKeys(null);
                  setError(null);
                }}
                options={SIZE_OPTIONS}
                ariaLabel="RSA 密钥长度"
              />
            </ToolField>
          </div>
          <Button onClick={() => void generate()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {busy ? "生成中…" : "生成密钥对"}
          </Button>
          <Button variant="ghost" onClick={clear} disabled={busy || !keys}>
            <Trash2 className="h-4 w-4" />
            清除
          </Button>
        </div>

        {busy && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />正在本地生成 {size} 位 RSA 密钥，这可能需要几秒钟…
          </div>
        )}
        {error && <ErrorBox>{error}</ErrorBox>}

        {keys && (
          <div className="space-y-4">
            <KeyOutput
              label="公钥 · SPKI PEM"
              value={keys.publicKey}
              filename="rsa-public-key.pem"
            />
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 sm:p-4">
              <KeyOutput
                label="私钥 · PKCS#8 PEM"
                value={keys.privateKey}
                filename="rsa-private-key.pem"
                privateKey
              />
            </section>
          </div>
        )}

        {!keys && !busy && !error && (
          <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
            选择密钥长度后点击“生成密钥对”
          </div>
        )}

        <p className="text-center text-[11px] leading-5 text-muted-foreground">
          输出使用标准 `PUBLIC KEY`（SPKI）和 `PRIVATE KEY`（PKCS#8）PEM 格式；重新生成或关闭页面后，当前私钥不会保留。
        </p>
      </div>
    </ToolShell>
  );
}

function KeyOutput({
  label,
  value,
  filename,
  privateKey = false,
}: {
  label: string;
  value: string;
  filename: string;
  privateKey?: boolean;
}) {
  return (
    <ToolField
      label={label}
      hint={privateKey ? "请妥善保管" : "可公开"}
      action={(
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <CopyButton value={value} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadText(value, filename)}
          >
            <Download className="h-3.5 w-3.5" />
            下载
          </Button>
        </div>
      )}
    >
      <TextArea
        value={value}
        readOnly
        rows={9}
        spellCheck={false}
        className="resize-y bg-muted/30 text-xs leading-5"
        aria-label={label}
      />
    </ToolField>
  );
}
