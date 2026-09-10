export const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
export const MAX_GZIP_BYTES = 25 * 1024 * 1024;
export const MAX_ARCHIVE_ENTRIES = 1000;
export const MAX_ENTRY_BYTES = 50 * 1024 * 1024;
export const MAX_TOTAL_UNCOMPRESSED_BYTES = 200 * 1024 * 1024;
export const MAX_PREVIEW_BYTES = 1024 * 1024;

export type ArchiveFormat = "zip" | "gzip";

export type ArchiveEntry = {
  id: string;
  rawName: string;
  safePath: string | null;
  compressedSize: number;
  originalSize: number;
  compression: number;
  encrypted: boolean;
  directory: boolean;
};

export type ArchiveInfo = {
  format: ArchiveFormat;
  entries: ArchiveEntry[];
};

const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;

export function isSupportedArchive(file: File): boolean {
  return /\.(zip|gz|tgz)$/i.test(file.name);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function isPreviewableText(entry: ArchiveEntry): boolean {
  return (
    !entry.directory &&
    entry.originalSize <= MAX_PREVIEW_BYTES &&
    /\.(?:txt|md|markdown|json|jsonl|csv|tsv|xml|yml|yaml|toml|ini|cfg|conf|log|html?|css|js|mjs|cjs|ts|tsx|jsx|py|go|rs|java|c|cc|cpp|h|sh|sql)$/i.test(
      entry.safePath ?? "",
    )
  );
}

export async function inspectArchive(file: File): Promise<ArchiveInfo> {
  if (file.size > MAX_ARCHIVE_BYTES) {
    throw new Error("压缩包不能超过 100 MB。");
  }

  const data = new Uint8Array(await file.arrayBuffer());
  if (hasZipSignature(data)) {
    return { format: "zip", entries: parseZipEntries(data) };
  }
  if (hasGzipSignature(data)) {
    if (file.size > MAX_GZIP_BYTES) {
      throw new Error("GZIP 文件不能超过 25 MB，以避免解压时占用过多内存。");
    }
    const name = getGzipFileName(data) ?? getGzipFallbackName(file.name);
    const safePath = normalizeArchivePath(name);
    return {
      format: "gzip",
      entries: [
        {
          id: "gzip-0",
          rawName: name,
          safePath,
          compressedSize: file.size,
          originalSize: 0,
          compression: 8,
          encrypted: false,
          directory: false,
        },
      ],
    };
  }
  throw new Error("无法识别压缩格式。仅支持 ZIP、GZIP 和 TGZ，且不支持 RAR、7z 或加密压缩包。");
}

export async function extractArchiveEntry(
  file: File,
  format: ArchiveFormat,
  entry: ArchiveEntry,
): Promise<Uint8Array> {
  if (!entry.safePath || entry.directory) {
    throw new Error("此条目没有可安全下载的文件名。");
  }
  if (entry.encrypted) {
    throw new Error("此 ZIP 条目已加密，暂不支持解压。");
  }
  if (format === "gzip") return extractGzip(file);
  if (entry.compression !== 0 && entry.compression !== 8) {
    throw new Error("此 ZIP 条目使用了暂不支持的压缩算法。");
  }

  const { unzip } = await import("fflate");
  const data = new Uint8Array(await file.arrayBuffer());
  const extracted = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(
      data,
      { filter: (candidate) => candidate.name === entry.rawName },
      (error, files) => {
        if (error) reject(error);
        else resolve(files);
      },
    );
  });
  const bytes = extracted[entry.rawName];
  if (!bytes) throw new Error("未能在压缩包中找到该条目。");
  if (bytes.byteLength > MAX_ENTRY_BYTES) {
    throw new Error("解压后的文件超过 50 MB，已取消操作。");
  }
  return bytes;
}

export function getDownloadName(entry: ArchiveEntry): string {
  const filename = entry.safePath?.split("/").pop()?.replace(/[\\/\0]/g, "");
  return filename || "extracted-file";
}

function parseZipEntries(data: Uint8Array): ArchiveEntry[] {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const end = findEndOfCentralDirectory(view);
  if (end < 0) {
    throw new Error("未找到 ZIP 目录。该文件可能损坏、使用了不支持的 ZIP64 格式，或不是标准 ZIP。");
  }

  const disk = view.getUint16(end + 4, true);
  const centralDirectoryDisk = view.getUint16(end + 6, true);
  const entriesOnDisk = view.getUint16(end + 8, true);
  const entryCount = view.getUint16(end + 10, true);
  const directorySize = view.getUint32(end + 12, true);
  const directoryOffset = view.getUint32(end + 16, true);
  if (
    disk !== 0 ||
    centralDirectoryDisk !== 0 ||
    entriesOnDisk !== entryCount ||
    entryCount === 0xffff ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff
  ) {
    throw new Error("暂不支持多磁盘或 ZIP64 压缩包。");
  }
  if (entryCount > MAX_ARCHIVE_ENTRIES) {
    throw new Error(`压缩包最多支持 ${MAX_ARCHIVE_ENTRIES} 个条目。`);
  }
  if (directoryOffset + directorySize > data.byteLength) {
    throw new Error("ZIP 目录超出文件范围，压缩包可能已损坏。");
  }

  const entries: ArchiveEntry[] = [];
  const names = new Set<string>();
  let offset = directoryOffset;
  let totalUncompressed = 0;
  for (let index = 0; index < entryCount; index++) {
    if (offset + 46 > data.byteLength || view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_HEADER) {
      throw new Error("ZIP 条目目录不完整，压缩包可能已损坏。");
    }
    const flags = view.getUint16(offset + 8, true);
    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const originalSize = view.getUint32(offset + 24, true);
    const filenameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const nextOffset = offset + 46 + filenameLength + extraLength + commentLength;
    if (nextOffset > data.byteLength || localHeaderOffset + 4 > data.byteLength) {
      throw new Error("ZIP 条目超出文件范围，压缩包可能已损坏。");
    }
    if (compressedSize === 0xffffffff || originalSize === 0xffffffff || localHeaderOffset === 0xffffffff) {
      throw new Error("暂不支持包含 ZIP64 条目的压缩包。");
    }
    if (view.getUint32(localHeaderOffset, true) !== ZIP_LOCAL_FILE_HEADER) {
      throw new Error("ZIP 本地文件头无效，压缩包可能已损坏。");
    }

    const rawName = decodeFileName(data.subarray(offset + 46, offset + 46 + filenameLength));
    const safePath = normalizeArchivePath(rawName);
    if (safePath && names.has(safePath)) {
      throw new Error("压缩包包含重复文件名，无法安全选择要下载的条目。");
    }
    if (safePath) names.add(safePath);

    const directory = rawName.endsWith("/") || rawName.endsWith("\\");
    if (!directory) {
      if (originalSize > MAX_ENTRY_BYTES) {
        throw new Error(`条目“${safePath ?? "未命名文件"}”解压后超过 50 MB。`);
      }
      totalUncompressed += originalSize;
      if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED_BYTES) {
        throw new Error("压缩包预计解压后超过 200 MB，已拒绝处理。");
      }
    }

    entries.push({
      id: `zip-${index}`,
      rawName,
      safePath,
      compressedSize,
      originalSize,
      compression,
      encrypted: (flags & 0x1) !== 0,
      directory,
    });
    offset = nextOffset;
  }
  return entries;
}

async function extractGzip(file: File): Promise<Uint8Array> {
  const { Gunzip } = await import("fflate");
  const input = new Uint8Array(await file.arrayBuffer());
  const chunks: Uint8Array[] = [];
  let outputLength = 0;
  const gunzip = new Gunzip((chunk) => {
    outputLength += chunk.byteLength;
    if (outputLength > MAX_ENTRY_BYTES) {
      throw new Error("解压后的文件超过 50 MB，已取消操作。");
    }
    chunks.push(chunk);
  });

  const chunkSize = 64 * 1024;
  for (let offset = 0; offset < input.length; offset += chunkSize) {
    gunzip.push(input.subarray(offset, Math.min(offset + chunkSize, input.length)), offset + chunkSize >= input.length);
  }

  const output = new Uint8Array(outputLength);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function findEndOfCentralDirectory(view: DataView): number {
  const earliest = Math.max(0, view.byteLength - 0xffff - 22);
  for (let offset = view.byteLength - 22; offset >= earliest; offset--) {
    if (
      view.getUint32(offset, true) === ZIP_END_OF_CENTRAL_DIRECTORY &&
      offset + 22 + view.getUint16(offset + 20, true) === view.byteLength
    ) {
      return offset;
    }
  }
  return -1;
}

function hasZipSignature(data: Uint8Array): boolean {
  if (data.length < 4) return false;
  const signature = new DataView(data.buffer, data.byteOffset, 4).getUint32(0, true);
  return signature === ZIP_LOCAL_FILE_HEADER || signature === ZIP_END_OF_CENTRAL_DIRECTORY;
}

function hasGzipSignature(data: Uint8Array): boolean {
  return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
}

function decodeFileName(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/\0/g, "");
}

function normalizeArchivePath(value: string): string | null {
  const normalized = value.replaceAll("\\", "/");
  const withoutTrailingSlash = normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
  if (
    !withoutTrailingSlash ||
    withoutTrailingSlash.startsWith("/") ||
    /^[a-zA-Z]:/.test(withoutTrailingSlash)
  ) {
    return null;
  }
  const parts = withoutTrailingSlash.split("/");
  if (parts.some((part) => part === "." || part === ".." || !part || /\0/.test(part))) return null;
  return parts.join("/");
}

function getGzipFallbackName(fileName: string): string {
  if (/\.tar\.gz$/i.test(fileName)) return fileName.replace(/\.gz$/i, "");
  if (/\.(?:tgz|gz)$/i.test(fileName)) return fileName.replace(/\.(?:tgz|gz)$/i, "") || "extracted-file";
  return "extracted-file";
}

function getGzipFileName(data: Uint8Array): string | null {
  if (data.length < 10) return null;
  const flags = data[3];
  let offset = 10;
  if (flags & 0x04) {
    if (offset + 2 > data.length) return null;
    const extraLength = data[offset] | (data[offset + 1] << 8);
    offset += 2 + extraLength;
  }
  if (flags & 0x08) {
    const end = data.indexOf(0, offset);
    if (end < 0) return null;
    return decodeFileName(data.subarray(offset, end));
  }
  return null;
}
