export type Rgb = [number, number, number];

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

export function luminance([r, g, b]: Rgb): number {
  const channel = (v: number) => {
    const n = v / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Median-cut color quantization. Input is sampled (at most ~20k pixels) to
 * bound browser work for large uploads; transparent pixels are excluded.
 */
export function dominantColors(data: Uint8ClampedArray, count: number): Rgb[] {
  const pixels: Rgb[] = [];
  const step = Math.max(1, Math.floor(data.length / 4 / 20_000));
  for (let i = 0; i < data.length; i += step * 4) {
    if (data[i + 3] > 127) pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (!pixels.length) return [];

  const boxes: Rgb[][] = [pixels];
  while (boxes.length < count) {
    let index = -1;
    let widest = -1;
    let channel = 0;
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      if (box.length < 2) continue;
      const ranges = [0, 1, 2].map((c) => Math.max(...box.map((p) => p[c])) - Math.min(...box.map((p) => p[c])));
      const max = Math.max(...ranges);
      if (max > widest) { widest = max; index = i; channel = ranges.indexOf(max); }
    }
    if (index < 0) break;
    const box = [...boxes[index]].sort((a, b) => a[channel] - b[channel]);
    const middle = Math.floor(box.length / 2);
    boxes.splice(index, 1, box.slice(0, middle), box.slice(middle));
  }

  return boxes
    .filter((box) => box.length)
    .map((box) => box.reduce<Rgb>((sum, p) => [sum[0] + p[0], sum[1] + p[1], sum[2] + p[2]], [0, 0, 0]).map((v) => Math.round(v / box.length)) as Rgb)
    .sort((a, b) => luminance(a) - luminance(b));
}
