export type ExifField = { label: string; value: string };

const TAGS: Record<number, string> = {
  0x010f: "设备厂商", 0x0110: "设备型号", 0x0112: "方向", 0x0132: "拍摄/修改时间",
  0x829a: "曝光时间", 0x829d: "光圈", 0x8827: "ISO", 0x9003: "原始拍摄时间",
  0x9209: "闪光灯", 0x920a: "焦距", 0xa433: "镜头厂商", 0xa434: "镜头型号",
};

function u16(view: DataView, pos: number, le: boolean) { return view.getUint16(pos, le); }
function u32(view: DataView, pos: number, le: boolean) { return view.getUint32(pos, le); }

function rational(view: DataView, pos: number, le: boolean): string {
  const d = u32(view, pos + 4, le);
  if (!d) return "—";
  const n = u32(view, pos, le);
  return n === 1 ? `1/${d}` : `${(n / d).toFixed(3).replace(/\.0+$/, "")}`;
}

function entryValue(view: DataView, base: number, entry: number, le: boolean): string | null {
  const type = u16(view, entry + 2, le);
  const count = u32(view, entry + 4, le);
  const raw = entry + 8;
  const offset = type === 2 && count <= 4 ? raw : base + u32(view, raw, le);
  try {
    if (type === 2) {
      let text = "";
      for (let i = 0; i < count && view.getUint8(offset + i) !== 0; i += 1) text += String.fromCharCode(view.getUint8(offset + i));
      return text || null;
    }
    if (type === 3) return String(u16(view, raw, le));
    if (type === 4) return String(u32(view, raw, le));
    if (type === 5) return rational(view, offset, le);
  } catch { return null; }
  return null;
}

function parseIfd(view: DataView, base: number, offset: number, le: boolean, seen = new Set<number>()): ExifField[] {
  if (!offset || seen.has(offset)) return [];
  seen.add(offset);
  const start = base + offset;
  if (start + 2 > view.byteLength) return [];
  const count = u16(view, start, le);
  const values: ExifField[] = [];
  for (let i = 0; i < count; i += 1) {
    const entry = start + 2 + i * 12;
    if (entry + 12 > view.byteLength) break;
    const tag = u16(view, entry, le);
    const pointer = tag === 0x8769 || tag === 0x8825 ? u32(view, entry + 8, le) : 0;
    if (pointer) values.push(...parseIfd(view, base, pointer, le, seen));
    const label = TAGS[tag];
    const value = label ? entryValue(view, base, entry, le) : null;
    if (value) values.push({ label, value: tag === 0x0112 ? orientation(value) : value });
  }
  return values;
}

function orientation(value: string): string {
  const labels: Record<string, string> = { "1": "正常", "3": "旋转 180°", "6": "顺时针 90°", "8": "逆时针 90°" };
  return labels[value] ?? value;
}

/** Extract common EXIF fields from a JPEG APP1/Exif segment. */
export async function readExif(file: File): Promise<ExifField[]> {
  if (file.type !== "image/jpeg" && file.type !== "image/jpg") return [];
  const view = new DataView(await file.arrayBuffer());
  if (view.byteLength < 12 || view.getUint16(0) !== 0xffd8) return [];
  let pos = 2;
  while (pos + 4 < view.byteLength) {
    if (view.getUint8(pos) !== 0xff) { pos += 1; continue; }
    const marker = view.getUint8(pos + 1);
    const len = view.getUint16(pos + 2);
    if (marker === 0xe1 && pos + 10 < view.byteLength && String.fromCharCode(...[0, 1, 2, 3].map((i) => view.getUint8(pos + 4 + i))) === "Exif") {
      const base = pos + 10;
      const byteOrder = String.fromCharCode(view.getUint8(base), view.getUint8(base + 1));
      if (byteOrder !== "II" && byteOrder !== "MM") return [];
      const le = byteOrder === "II";
      if (u16(view, base + 2, le) !== 42) return [];
      return parseIfd(view, base, u32(view, base + 4, le), le);
    }
    if (marker === 0xda || marker === 0xd9 || len < 2) break;
    pos += 2 + len;
  }
  return [];
}

/** Canvas re-encoding copies pixels only, intentionally dropping metadata. */
export async function stripMetadata(file: File): Promise<{ blob: Blob; extension: "jpg" | "png" }> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    const jpeg = file.type === "image/jpeg" || file.type === "image/jpg";
    const type = jpeg ? "image/jpeg" : "image/png";
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("图片重编码失败")), type, jpeg ? 0.95 : undefined));
    return { blob, extension: jpeg ? "jpg" : "png" };
  } finally { bitmap.close(); }
}
