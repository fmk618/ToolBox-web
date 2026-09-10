export const ICON_SIZES = [16, 32, 48, 180, 192, 512] as const;
export const MAX_IMAGE_PIXELS = 16_000_000;

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取图片"));
    };
    image.src = url;
  });
}

export async function imageToPng(file: Blob, size: number, background = "#ffffff"): Promise<Blob> {
  const image = await loadImage(file);
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
    throw new Error("图片尺寸过大或无效");
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("当前浏览器不支持 Canvas");
  context.fillStyle = background;
  context.fillRect(0, 0, size, size);
  const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片导出失败")), "image/png");
  });
}

export async function pngsToIco(images: readonly { size: number; blob: Blob }[]): Promise<Blob> {
  if (!images.length) throw new Error("没有可导出的图标");
  const buffers = await Promise.all(images.map(({ blob }) => blob.arrayBuffer()));
  const headerSize = 6 + images.length * 16;
  const dataSize = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
  const output = new Uint8Array(headerSize + dataSize);
  const view = new DataView(output.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);
  let offset = headerSize;
  buffers.forEach((buffer, index) => {
    const entry = 6 + index * 16;
    const size = images[index].size;
    output[entry] = size >= 256 ? 0 : size;
    output[entry + 1] = size >= 256 ? 0 : size;
    output[entry + 2] = 0;
    output[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, buffer.byteLength, true);
    view.setUint32(entry + 12, offset, true);
    output.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  });
  return new Blob([output], { type: "image/x-icon" });
}
