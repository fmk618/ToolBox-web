export type FormatMeta = {
  key: string;
  label: string;
  ext: string;
  category: "doc" | "markup" | "office" | "data" | "ebook";
  color: string; // tailwind text color
  bg: string;    // tailwind bg color
};

export const FORMATS: Record<string, FormatMeta> = {
  pdf:  { key: "pdf",  label: "PDF",       ext: "pdf",  category: "doc",    color: "text-red-700",    bg: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900" },
  docx: { key: "docx", label: "Word",      ext: "docx", category: "office", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900" },
  doc:  { key: "doc",  label: "Word 97",   ext: "doc",  category: "office", color: "text-blue-700",   bg: "bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900" },
  md:   { key: "md",   label: "Markdown",  ext: "md",   category: "markup", color: "text-slate-700",  bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700" },
  html: { key: "html", label: "HTML",      ext: "html", category: "markup", color: "text-orange-700", bg: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900" },
  pptx: { key: "pptx", label: "PowerPoint",ext: "pptx", category: "office", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900" },
  ppt:  { key: "ppt",  label: "PPT 97",    ext: "ppt",  category: "office", color: "text-amber-700",  bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900" },
  xlsx: { key: "xlsx", label: "Excel",     ext: "xlsx", category: "office", color: "text-green-700",  bg: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900" },
  xls:  { key: "xls",  label: "Excel 97",  ext: "xls",  category: "office", color: "text-green-700",  bg: "bg-green-50 border-green-200 dark:bg-green-950/40 dark:border-green-900" },
  epub: { key: "epub", label: "EPUB",      ext: "epub", category: "ebook",  color: "text-purple-700", bg: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900" },
  txt:  { key: "txt",  label: "纯文本",     ext: "txt",  category: "doc",    color: "text-slate-700",  bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700" },
  rtf:  { key: "rtf",  label: "RTF",       ext: "rtf",  category: "doc",    color: "text-slate-700",  bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700" },
  odt:  { key: "odt",  label: "ODT",       ext: "odt",  category: "office", color: "text-cyan-700",   bg: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-900" },
  csv:  { key: "csv",  label: "CSV",       ext: "csv",  category: "data",   color: "text-teal-700",   bg: "bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-900" },
  json: { key: "json", label: "JSON",      ext: "json", category: "data",   color: "text-teal-700",   bg: "bg-teal-50 border-teal-200 dark:bg-teal-950/40 dark:border-teal-900" },
};

export const EXT_TO_FMT: Record<string, string> = {
  pdf: "pdf", docx: "docx", doc: "doc",
  md: "md", markdown: "md",
  html: "html", htm: "html",
  pptx: "pptx", ppt: "ppt",
  xlsx: "xlsx", xls: "xls",
  epub: "epub", txt: "txt", rtf: "rtf",
  odt: "odt", csv: "csv", json: "json",
};

export function detectFormat(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_FMT[ext] ?? null;
}

export function fmtMeta(key: string): FormatMeta {
  return FORMATS[key] ?? { key, label: key.toUpperCase(), ext: key, category: "doc", color: "text-slate-700", bg: "bg-slate-50 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700" };
}
