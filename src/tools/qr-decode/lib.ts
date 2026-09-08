export type BarcodeDetectorLike = {
  detect(source: ImageBitmapSource): Promise<{ rawValue?: string; format?: string }[]>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

export function supportedDetector(): BarcodeDetectorConstructor | null {
  const ctor = (globalThis as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

export async function decodeQr(file: File): Promise<string> {
  const Detector = supportedDetector();
  if (!Detector) throw new Error("当前浏览器不支持二维码识别。请使用最新版 Chrome、Edge 或支持 BarcodeDetector 的浏览器。");
  const bitmap = await createImageBitmap(file);
  try {
    const detector = new Detector({ formats: ["qr_code"] });
    const results = await detector.detect(bitmap);
    const value = results.find((r) => r.rawValue)?.rawValue;
    if (!value) throw new Error("未检测到二维码，请确认图片清晰且二维码完整。");
    return value;
  } finally {
    bitmap.close();
  }
}
