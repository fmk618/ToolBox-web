export const MAX_PDF_BYTES = 50 * 1024 * 1024;
export const MAX_PDF_PAGES = 200;
export const MAX_OUTPUT_PDF_BYTES = 100 * 1024 * 1024;

export type OrganizedPage = {
  id: string;
  sourceIndex: number;
  rotation: 0 | 90 | 180 | 270;
};

export function createOrganizedPages(pageCount: number): OrganizedPage[] {
  return Array.from({ length: pageCount }, (_, sourceIndex) => ({
    id: `page-${sourceIndex + 1}`,
    sourceIndex,
    rotation: 0,
  }));
}

export function movePage(
  pages: OrganizedPage[],
  id: string,
  direction: -1 | 1,
): OrganizedPage[] {
  const index = pages.findIndex((page) => page.id === id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= pages.length) return pages;

  const next = [...pages];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function rotatePage(
  pages: OrganizedPage[],
  id: string,
  angle: -90 | 90,
): OrganizedPage[] {
  return pages.map((page) => {
    if (page.id !== id) return page;
    const rotation = ((page.rotation + angle + 360) % 360) as OrganizedPage["rotation"];
    return { ...page, rotation };
  });
}

export function removePage(pages: OrganizedPage[], id: string): OrganizedPage[] {
  return pages.filter((page) => page.id !== id);
}

export function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

export async function inspectPdf(file: File): Promise<number> {
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("PDF 文件不能超过 50 MB。");
  }

  const { PDFDocument } = await import("pdf-lib");
  const document = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = document.getPageCount();
  if (pageCount > MAX_PDF_PAGES) {
    throw new Error(`PDF 最多支持 ${MAX_PDF_PAGES} 页。`);
  }
  return pageCount;
}

export async function createOrganizedPdf(
  file: File,
  pages: OrganizedPage[],
): Promise<Uint8Array> {
  if (pages.length === 0) {
    throw new Error("请至少保留一页 PDF。");
  }

  const { PDFDocument, degrees } = await import("pdf-lib");
  const source = await PDFDocument.load(await file.arrayBuffer());
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(
    source,
    pages.map((page) => page.sourceIndex),
  );

  for (const [index, page] of copiedPages.entries()) {
    const originalRotation = page.getRotation().angle;
    page.setRotation(degrees((originalRotation + pages[index].rotation) % 360));
    output.addPage(page);
  }

  const bytes = await output.save();
  if (bytes.byteLength > MAX_OUTPUT_PDF_BYTES) {
    throw new Error("生成的 PDF 超过 100 MB，已取消下载。");
  }
  return bytes;
}

export function getPdfErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/encrypt/i.test(message)) {
    return "此 PDF 已加密或受密码保护，暂不支持整理。请先在 PDF 阅读器中移除密码保护。";
  }
  if (/failed to parse|missing pdf header|invalid pdf/i.test(message)) {
    return "无法读取此 PDF。请确认文件未损坏且确实是 PDF 格式。";
  }
  return message || "处理 PDF 时发生未知错误。";
}
