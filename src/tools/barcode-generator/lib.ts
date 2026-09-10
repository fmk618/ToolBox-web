function checkDigit(value: string): number {
  let sum = 0;
  for (let index = 0; index < value.length; index += 1) {
    const digit = Number(value[value.length - 1 - index]);
    sum += digit * (index % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

export function validateBarcode(value: string, format: string): string {
  const text = value.trim();
  if (!text) return "请输入条形码内容";
  if (format === "CODE128" && /[^\x20-\x7e]/u.test(text)) return "CODE128 仅支持可打印 ASCII 字符";
  if (format === "CODE39" && !/^[0-9A-Z .\-$/+%]+$/u.test(text)) return "CODE39 仅支持大写字母、数字和 . - $ / + % 空格";
  const lengths: Record<string, readonly number[]> = { EAN13: [12, 13], EAN8: [7, 8], UPC: [11, 12] };
  if (lengths[format] && (!/^\d+$/u.test(text) || !lengths[format].includes(text.length))) {
    return `${format} 需要 ${lengths[format].join(" 或 ")} 位数字`;
  }
  if (lengths[format] && text.length === Math.max(...lengths[format])) {
    const expected = checkDigit(text.slice(0, -1));
    if (expected !== Number(text.at(-1))) return `${format} 校验位不正确，应为 ${expected}`;
  }
  return "";
}
