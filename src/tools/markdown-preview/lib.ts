import DOMPurify from "dompurify";
import { marked } from "marked";

export const MAX_MARKDOWN_INPUT = 1 * 1024 * 1024;

const SAFE_URI = /^(?:(?:https?|mailto|tel):|[^a-z]|$)/iu;

export function renderMarkdown(input: string): string {
  if (input.length > MAX_MARKDOWN_INPUT) throw new Error("Markdown 内容不能超过 1 MB");
  const parsed = marked.parse(input, { async: false });
  if (typeof parsed !== "string") throw new Error("Markdown 渲染失败");
  return DOMPurify.sanitize(parsed, {
    ALLOWED_URI_REGEXP: SAFE_URI,
    USE_PROFILES: { html: true },
  });
}
