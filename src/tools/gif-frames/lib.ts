import type { ParsedFrame } from "gifuct-js";

export const MAX_GIF_BYTES = 20 * 1024 * 1024;
export const MAX_GIF_PIXELS = 8 * 1024 * 1024;
export const MAX_GIF_FRAMES = 300;
export const MAX_PATCH_BYTES = 100 * 1024 * 1024;
export const MAX_EXPORT_FRAMES = 30;
export const MAX_EXPORT_BYTES = 100 * 1024 * 1024;
export const MAX_CONTACT_SHEET_SIDE = 4096;

export type GifFrame = Pick<ParsedFrame, "dims" | "delay" | "disposalType" | "patch">;

export type GifInfo = {
  width: number;
  height: number;
  frames: GifFrame[];
  durationMs: number;
};

export type RenderedGifFrame = {
  index: number;
  blob: Blob;
};

export function isGifFile(file: File): boolean {
  return file.type === "image/gif" || /\.gif$/iu.test(file.name);
}

export function formatGifDuration(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(milliseconds % 1000 === 0 ? 0 : 1)} 秒`;
}

export async function inspectGif(file: File): Promise<GifInfo> {
  if (!isGifFile(file)) throw new Error("请选择 GIF 文件。");
  if (!file.size) throw new Error("GIF 文件为空。");
  if (file.size > MAX_GIF_BYTES) {
    throw new Error("GIF 文件不能超过 20 MB。");
  }

  const source = await file.arrayBuffer();
  const { decompressFrames, parseGIF } = await import("gifuct-js");
  let parsed: ReturnType<typeof parseGIF>;
  let frames: GifFrame[];
  try {
    parsed = parseGIF(source);
    if (parsed.header.signature !== "GIF") throw new Error("NOT_GIF");
    frames = decompressFrames(parsed, true);
  } catch {
    throw new Error("无法解析此 GIF。文件可能已损坏或使用了不支持的编码。");
  }

  const { width, height } = parsed.lsd;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    throw new Error("GIF 画布尺寸无效。");
  }
  if (width * height > MAX_GIF_PIXELS) {
    throw new Error("GIF 画布不能超过 800 万像素。");
  }
  if (!frames.length) throw new Error("GIF 中没有可提取的图像帧。");
  if (frames.length > MAX_GIF_FRAMES) {
    throw new Error("GIF 最多支持 300 帧。请先缩短动画后再试。");
  }

  let patchBytes = 0;
  let durationMs = 0;
  for (const frame of frames) {
    validateFrame(frame, width, height);
    patchBytes += frame.patch.byteLength;
    if (patchBytes > MAX_PATCH_BYTES) {
      throw new Error("GIF 解码后的帧数据超过 100 MB，无法安全处理。");
    }
    durationMs += Math.max(0, frame.delay) * 10;
  }

  return { width, height, frames, durationMs };
}

/**
 * 逐帧重放 GIF，并按 disposal mode 处理上一帧画面。仅生成调用方选中的帧，
 * 避免将所有完整画面同时保存在内存中。
 */
export async function renderGifFrames(info: GifInfo, frameIndexes: readonly number[]): Promise<RenderedGifFrame[]> {
  const indexes = normalizeFrameIndexes(frameIndexes, info.frames.length);
  const wanted = new Set(indexes);
  const canvas = document.createElement("canvas");
  canvas.width = info.width;
  canvas.height = info.height;
  const context = getContext(canvas);
  const patchCanvas = document.createElement("canvas");
  const patchContext = getContext(patchCanvas);
  const rendered: RenderedGifFrame[] = [];
  let outputBytes = 0;

  for (let index = 0; index < info.frames.length; index += 1) {
    const frame = info.frames[index];
    const { dims } = frame;
    const restore = frame.disposalType === 3
      ? context.getImageData(0, 0, info.width, info.height)
      : null;

    patchCanvas.width = dims.width;
    patchCanvas.height = dims.height;
    const patch = new Uint8ClampedArray(frame.patch.length);
    patch.set(frame.patch);
    patchContext.putImageData(new ImageData(patch, dims.width, dims.height), 0, 0);
    context.drawImage(patchCanvas, dims.left, dims.top);

    if (wanted.has(index)) {
      const blob = await canvasToPng(canvas);
      outputBytes += blob.size;
      if (outputBytes > MAX_EXPORT_BYTES) {
        throw new Error("导出的 PNG 总大小超过 100 MB。请减少所选帧或降低 GIF 尺寸。");
      }
      rendered.push({ index, blob });
    }

    if (frame.disposalType === 2) {
      context.clearRect(dims.left, dims.top, dims.width, dims.height);
    } else if (restore) {
      context.putImageData(restore, 0, 0);
    }
  }

  return rendered;
}

export async function createContactSheet(
  info: GifInfo,
  rendered: readonly RenderedGifFrame[],
): Promise<Blob> {
  if (!rendered.length) throw new Error("请至少选择一帧。");
  const columns = Math.ceil(Math.sqrt(rendered.length));
  const rows = Math.ceil(rendered.length / columns);
  const scale = Math.min(
    1,
    MAX_CONTACT_SHEET_SIDE / (columns * info.width),
    MAX_CONTACT_SHEET_SIDE / (rows * info.height),
  );
  const cellWidth = Math.max(1, Math.floor(info.width * scale));
  const cellHeight = Math.max(1, Math.floor(info.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cellWidth * columns;
  canvas.height = cellHeight * rows;
  const context = getContext(canvas);

  try {
    for (let position = 0; position < rendered.length; position += 1) {
      const bitmap = await createImageBitmap(rendered[position].blob);
      const x = (position % columns) * cellWidth;
      const y = Math.floor(position / columns) * cellHeight;
      context.drawImage(bitmap, x, y, cellWidth, cellHeight);
      bitmap.close();
    }
    return await canvasToPng(canvas);
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}

export async function createFramesZip(rendered: readonly RenderedGifFrame[]): Promise<Blob> {
  if (rendered.length < 2) throw new Error("导出 ZIP 至少需要选择两帧。");
  const files: Record<string, Uint8Array> = {};
  let bytes = 0;
  for (const frame of rendered) {
    const data = new Uint8Array(await frame.blob.arrayBuffer());
    bytes += data.byteLength;
    if (bytes > MAX_EXPORT_BYTES) {
      throw new Error("导出的 PNG 总大小超过 100 MB。请减少所选帧或降低 GIF 尺寸。");
    }
    files[frameDownloadName(frame.index)] = data;
  }
  const { zipSync } = await import("fflate");
  return new Blob([zipSync(files, { level: 6 })], { type: "application/zip" });
}

export function frameDownloadName(index: number): string {
  return `gif-frame-${String(index + 1).padStart(3, "0")}.png`;
}

export function gifDownloadBaseName(fileName: string): string {
  const base = fileName.replace(/\.gif$/iu, "").trim() || "gif-frames";
  return base.replace(/[\\/:*?"<>|\u0000-\u001f]/gu, "-").slice(0, 80) || "gif-frames";
}

function validateFrame(frame: GifFrame, width: number, height: number): void {
  const { dims, patch } = frame;
  if (
    !Number.isInteger(dims.width) ||
    !Number.isInteger(dims.height) ||
    !Number.isInteger(dims.left) ||
    !Number.isInteger(dims.top) ||
    dims.width < 1 ||
    dims.height < 1 ||
    dims.left < 0 ||
    dims.top < 0 ||
    dims.left + dims.width > width ||
    dims.top + dims.height > height ||
    patch.byteLength !== dims.width * dims.height * 4
  ) {
    throw new Error("GIF 包含无效帧尺寸，已停止处理。");
  }
}

function normalizeFrameIndexes(indexes: readonly number[], frameCount: number): number[] {
  const normalized = [...new Set(indexes)]
    .filter((index) => Number.isInteger(index) && index >= 0 && index < frameCount)
    .sort((left, right) => left - right);
  if (!normalized.length) throw new Error("请至少选择一帧。");
  if (normalized.length > MAX_EXPORT_FRAMES) {
    throw new Error("一次最多可导出 30 帧。请分批导出。");
  }
  return normalized;
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("浏览器无法创建画布，无法导出 GIF 帧。");
  return context;
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("浏览器无法编码 PNG，请尝试较小的 GIF。"));
    }, "image/png");
  });
}
