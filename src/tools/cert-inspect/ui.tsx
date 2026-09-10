"use client";

import { CalendarClock, FileKey2, Fingerprint, KeyRound, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "../../components/tools/button";
import { CopyButton } from "../../components/tools/copy-button";
import { ErrorBox } from "../../components/tools/error-box";
import { FileDropZone } from "../../components/tools/file-drop-zone";
import { ToolShell } from "../../components/tools/tool-shell";
import {
  MAX_CERTIFICATE_BYTES,
  inspectCertificate,
  isCertificateFile,
  type CertificateInspection,
} from "./lib";
import { meta } from "./meta";

export default function CertInspectUi() {
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<CertificateInspection | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(files: File[]) {
    const nextFile = files[0];
    if (!nextFile) return;
    setBusy(true);
    setError(null);
    setFile(null);
    setInspection(null);
    try {
      setInspection(await inspectCertificate(nextFile));
      setFile(nextFile);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setInspection(null);
    setError(null);
  }

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          仅解析公开 X.509 证书和 CSR，所有内容都在浏览器本地处理，不会上传或保存。为保护私钥，PEM 私钥、加密私钥和其他密钥文件会被拒绝；单个文件最多 {formatBytes(MAX_CERTIFICATE_BYTES)}。
        </div>

        {!inspection && (
          <FileDropZone
            accept=".cer,.cert,.crt,.der,.pem,.csr,application/pkix-cert,application/x-x509-ca-cert,application/pkcs10"
            validate={isCertificateFile}
            onFiles={(files) => void load(files)}
            title="拖入公开证书或 CSR，或"
            hint="支持 PEM / DER · .cer、.crt、.cert、.der、.pem、.csr · 最大 2 MB"
          />
        )}

        {busy && !inspection && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />正在本地解析公开信息…
          </div>
        )}

        {inspection && file && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card p-3 text-sm">
              <span className="max-w-full truncate font-medium text-foreground">{file.name}</span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                {inspection.kind === "certificate" ? <ShieldCheck className="h-3.5 w-3.5" /> : <FileKey2 className="h-3.5 w-3.5" />}
                {inspection.kind === "certificate" ? "X.509 证书" : "证书签名请求（CSR）"}
              </span>
              <span className="text-muted-foreground">{formatBytes(file.size)}</span>
              <Button variant="outline" size="sm" className="ml-auto" onClick={reset} disabled={busy}>
                <RotateCcw className="h-3.5 w-3.5" />检查其他文件
              </Button>
            </div>

            {inspection.kind === "certificate" && <ValidityCard inspection={inspection} />}

            <div className="grid gap-4 lg:grid-cols-2">
              <InfoCard title="主体 Subject" icon={<ShieldCheck className="h-4 w-4" />} items={inspection.subject} empty="未提供主体信息" />
              <InfoCard title="颁发者 Issuer" icon={<FileKey2 className="h-4 w-4" />} items={inspection.issuer} empty={inspection.kind === "csr" ? "CSR 尚未由 CA 签发" : "未提供颁发者信息"} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground"><Fingerprint className="h-4 w-4" />SHA-256 指纹</h2>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="break-all font-mono text-xs leading-5 text-foreground">{inspection.fingerprintSha256}</div>
                  <div className="mt-2"><CopyButton value={inspection.fingerprintSha256} /></div>
                </div>
                {inspection.serialNumber && <KeyValue label="序列号" value={inspection.serialNumber} mono />}
              </section>

              <section className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground"><KeyRound className="h-4 w-4" />算法</h2>
                <KeyValue label="公钥算法" value={`${inspection.publicKeyAlgorithm.name} (${inspection.publicKeyAlgorithm.oid})`} />
                <KeyValue label="签名算法" value={`${inspection.signatureAlgorithm.name} (${inspection.signatureAlgorithm.oid})`} />
                {inspection.basicConstraints && <KeyValue label="基本约束" value={inspection.basicConstraints} />}
              </section>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <StringListCard title="主题备用名称（SAN）" values={inspection.subjectAlternativeNames} empty="未包含 SAN" />
              <StringListCard title="密钥用法" values={inspection.keyUsage} empty="未声明密钥用法" />
              <StringListCard title="扩展密钥用法（EKU）" values={inspection.extendedKeyUsage} empty="未声明扩展密钥用法" />
            </div>
          </>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}
      </div>
    </ToolShell>
  );
}

function ValidityCard({ inspection }: { inspection: CertificateInspection }) {
  const status = validityStatus(inspection.validFrom, inspection.validTo);
  return (
    <section className={`rounded-xl border p-4 ${status.className}`}>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium"><CalendarClock className="h-4 w-4" />有效期：{status.label}</h2>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div><div className="text-xs text-muted-foreground">生效时间</div><div className="mt-1 text-foreground">{formatDate(inspection.validFrom)}</div></div>
        <div><div className="text-xs text-muted-foreground">到期时间</div><div className="mt-1 text-foreground">{formatDate(inspection.validTo)}</div></div>
      </div>
    </section>
  );
}

function InfoCard({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: ReactNode;
  items: CertificateInspection["subject"];
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">{icon}{title}</h2>
      {items.length ? <dl className="space-y-2">{items.map((item, index) => <div key={`${item.oid}-${index}`} className="grid gap-1 border-b border-border/70 pb-2 last:border-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)]"><dt className="text-xs text-muted-foreground">{item.label} <span className="font-mono">({item.oid})</span></dt><dd className="break-words text-sm text-foreground">{item.value || "—"}</dd></div>)}</dl> : <Empty>{empty}</Empty>}
    </section>
  );
}

function StringListCard({ title, values, empty }: { title: string; values: string[]; empty: string }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium text-foreground">{title}</h2>
      {values.length ? <ul className="space-y-2">{values.map((value, index) => <li key={`${value}-${index}`} className="break-all rounded-lg bg-muted/50 px-2.5 py-2 text-xs leading-5 text-foreground">{value}</li>)}</ul> : <Empty>{empty}</Empty>}
    </section>
  );
}

function KeyValue({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="mt-3 border-t border-border pt-3"><div className="text-xs text-muted-foreground">{label}</div><div className={`mt-1 break-all text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</div></div>;
}

function Empty({ children }: { children: string }) {
  return <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">{children}</div>;
}

function validityStatus(validFrom: string | null, validTo: string | null): { label: string; className: string } {
  const now = Date.now();
  const from = validFrom ? Date.parse(validFrom) : Number.NaN;
  const to = validTo ? Date.parse(validTo) : Number.NaN;
  if (Number.isNaN(from) || Number.isNaN(to)) return { label: "无法判断", className: "border-border bg-card" };
  if (now < from) return { label: "尚未生效", className: "border-sky-500/40 bg-sky-500/10" };
  if (now > to) return { label: "已过期", className: "border-destructive/40 bg-destructive/10" };
  if (to - now < 30 * 24 * 60 * 60 * 1000) return { label: "将在 30 天内到期", className: "border-amber-500/40 bg-amber-500/10" };
  return { label: "有效", className: "border-emerald-500/40 bg-emerald-500/10" };
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
