/** Unit conversion via `toBase`/`fromBase` function pairs.
 *
 * Linear units (length, weight) use simple multipliers. Temperature uses
 * funcs because Celsius↔Fahrenheit aren't proportional through zero.
 */

export type Unit = {
  id: string;
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
};

const linear = (factor: number): Pick<Unit, "toBase" | "fromBase"> => ({
  toBase: (v) => v * factor,
  fromBase: (v) => v / factor,
});

export type CategoryDef = {
  id: string;
  label: string;
  units: Unit[];
};

export const CATEGORIES: CategoryDef[] = [
  {
    id: "length",
    label: "长度",
    units: [
      { id: "m", label: "米 m", ...linear(1) },
      { id: "km", label: "千米 km", ...linear(1000) },
      { id: "cm", label: "厘米 cm", ...linear(0.01) },
      { id: "mm", label: "毫米 mm", ...linear(0.001) },
      { id: "mi", label: "英里 mi", ...linear(1609.344) },
      { id: "yd", label: "码 yd", ...linear(0.9144) },
      { id: "ft", label: "英尺 ft", ...linear(0.3048) },
      { id: "in", label: "英寸 in", ...linear(0.0254) },
      { id: "nmi", label: "海里 NM", ...linear(1852) },
    ],
  },
  {
    id: "weight",
    label: "重量",
    units: [
      { id: "kg", label: "千克 kg", ...linear(1) },
      { id: "g", label: "克 g", ...linear(0.001) },
      { id: "mg", label: "毫克 mg", ...linear(0.000001) },
      { id: "t", label: "吨 t", ...linear(1000) },
      { id: "lb", label: "磅 lb", ...linear(0.45359237) },
      { id: "oz", label: "盎司 oz", ...linear(0.0283495231) },
      { id: "jin", label: "斤", ...linear(0.5) },
      { id: "liang", label: "两", ...linear(0.05) },
    ],
  },
  {
    id: "temperature",
    label: "温度",
    units: [
      {
        id: "c",
        label: "摄氏度 °C",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: "f",
        label: "华氏度 °F",
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: "k",
        label: "开尔文 K",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
  },
  {
    id: "area",
    label: "面积",
    units: [
      { id: "m2", label: "平方米 m²", ...linear(1) },
      { id: "km2", label: "平方千米 km²", ...linear(1_000_000) },
      { id: "cm2", label: "平方厘米 cm²", ...linear(0.0001) },
      { id: "ha", label: "公顷 ha", ...linear(10_000) },
      { id: "mu", label: "亩", ...linear(666.6667) },
      { id: "acre", label: "英亩 acre", ...linear(4046.8564224) },
      { id: "ft2", label: "平方英尺 ft²", ...linear(0.09290304) },
    ],
  },
  {
    id: "volume",
    label: "体积",
    units: [
      { id: "l", label: "升 L", ...linear(1) },
      { id: "ml", label: "毫升 mL", ...linear(0.001) },
      { id: "m3", label: "立方米 m³", ...linear(1000) },
      { id: "gal_us", label: "加仑(美) gal", ...linear(3.785411784) },
      { id: "gal_uk", label: "加仑(英) gal", ...linear(4.54609) },
      { id: "cup", label: "杯 cup", ...linear(0.24) },
      { id: "tbsp", label: "汤匙 tbsp", ...linear(0.015) },
    ],
  },
  {
    id: "data",
    label: "数据量",
    units: [
      { id: "b", label: "字节 B", ...linear(1) },
      { id: "kb", label: "千字节 KB", ...linear(1024) },
      { id: "mb", label: "兆字节 MB", ...linear(1024 ** 2) },
      { id: "gb", label: "吉字节 GB", ...linear(1024 ** 3) },
      { id: "tb", label: "太字节 TB", ...linear(1024 ** 4) },
      { id: "bit", label: "比特 bit", ...linear(0.125) },
    ],
  },
];

export function convert(
  category: CategoryDef,
  fromUnitId: string,
  toUnitId: string,
  value: number,
): number | null {
  const from = category.units.find((u) => u.id === fromUnitId);
  const to = category.units.find((u) => u.id === toUnitId);
  if (!from || !to) return null;
  const base = from.toBase(value);
  const r = to.fromBase(base);
  if (!Number.isFinite(r)) return null;
  return Math.round(r * 1e10) / 1e10;
}
