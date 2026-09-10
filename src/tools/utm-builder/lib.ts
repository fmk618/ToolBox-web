export type UtmParams = {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
};

export const EMPTY_UTM: UtmParams = {
  source: "",
  medium: "",
  campaign: "",
  term: "",
  content: "",
};

export function buildUtmUrl(base: string, params: UtmParams): string {
  const value = base.trim();
  if (!value) throw new Error("请输入基础网址");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("基础网址格式无效");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("只支持 HTTP 或 HTTPS 网址");
  }
  const fields = ["source", "medium", "campaign", "term", "content"] as const;
  for (const field of fields) {
    const fieldValue = params[field].trim();
    if (fieldValue) url.searchParams.set(`utm_${field}`, fieldValue);
    else url.searchParams.delete(`utm_${field}`);
  }
  return url.toString();
}
