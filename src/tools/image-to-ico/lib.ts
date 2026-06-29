// 图片转 ICO —— 纯本地，Canvas 缩放 + 自实现 ICO 容器封装（内嵌 PNG，Vista+ 通用）。
// ICO 文件结构：6 字节 ICONDIR 头 + N×16 字节目录项 + 各尺寸 PNG 数据顺序拼接。

export const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256] as const;

/** 把图片按 contain 方式画到 size×size 的透明画布，导出 PNG ArrayBuffer。 */
function pngForSize(img: HTMLImageElement, size: number): Promise<ArrayBuffer> {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("canvas toBlob 失败"));
      blob.arrayBuffer().then(resolve, reject);
    }, "image/png");
  });
}

/** 由一张图片 + 选定尺寸列表生成一个多分辨率 .ico Blob。 */
export async function buildIco(
  img: HTMLImageElement,
  sizes: number[],
): Promise<Blob> {
  const ordered = [...new Set(sizes)].sort((a, b) => a - b);
  const pngs = await Promise.all(ordered.map((s) => pngForSize(img, s)));

  const count = ordered.length;
  const headerLen = 6 + count * 16;
  const header = new DataView(new ArrayBuffer(headerLen));
  header.setUint16(0, 0, true); // reserved
  header.setUint16(2, 1, true); // type = 1 (icon)
  header.setUint16(4, count, true); // image count

  let offset = headerLen;
  ordered.forEach((size, i) => {
    const png = pngs[i];
    const eo = 6 + i * 16;
    header.setUint8(eo, size >= 256 ? 0 : size); // width (0 = 256)
    header.setUint8(eo + 1, size >= 256 ? 0 : size); // height
    header.setUint8(eo + 2, 0); // palette count
    header.setUint8(eo + 3, 0); // reserved
    header.setUint16(eo + 4, 1, true); // color planes
    header.setUint16(eo + 6, 32, true); // bits per pixel
    header.setUint32(eo + 8, png.byteLength, true); // size of image data
    header.setUint32(eo + 12, offset, true); // offset of image data
    offset += png.byteLength;
  });

  return new Blob([header.buffer, ...pngs], { type: "image/x-icon" });
}

/** 读取 File 为已加载的 HTMLImageElement。 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取该图片"));
    };
    img.src = url;
  });
}
