/** 浏览器端文件下载 — 全站统一的下载入口，替代各工具手写的 <a> 拼装。 */

export function downloadDataUrl(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  // Give the browser time to start the download before freeing the URL —
  // revoking synchronously aborts large downloads (especially in Firefox).
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadText(
  text: string,
  filename: string,
  mime = "text/plain;charset=utf-8",
): void {
  downloadBlob(new Blob([text], { type: mime }), filename);
}
