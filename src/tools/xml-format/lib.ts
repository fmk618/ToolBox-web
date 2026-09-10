export const MAX_XML_INPUT = 5 * 1024 * 1024;

export function formatXml(input: string): string {
  if (input.length > MAX_XML_INPUT) throw new Error("XML 输入不能超过 5 MB");
  const source = input.trim();
  if (!source) return "";
  if (/<!DOCTYPE\b/iu.test(source)) throw new Error("为避免外部实体风险，不支持 DOCTYPE");

  const document = new DOMParser().parseFromString(source, "application/xml");
  if (document.querySelector("parsererror") || !document.documentElement) {
    throw new Error("XML 格式无效");
  }

  const serialized = new XMLSerializer().serializeToString(document.documentElement);
  const lines = serialized.replace(/(>)(<)(\/?)/gu, "$1\n$2$3").split("\n");
  let depth = 0;
  const output: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^<\//u.test(line)) depth = Math.max(0, depth - 1);
    output.push(`${"  ".repeat(depth)}${line}`);
    if (
      /^<[^!?/][^>]*[^/]>/u.test(line) &&
      !/<\/[^>]+>$/u.test(line)
    ) depth += 1;
  }

  const declaration = source.match(/^<\?xml[^?]*\?>/iu)?.[0];
  return declaration ? `${declaration}\n${output.join("\n")}` : output.join("\n");
}
