"use client";

import {
  BookOpen,
  Code,
  FileSpreadsheet,
  FileText,
  FileType,
  type LucideIcon,
} from "lucide-react";
import { FORMATS, fmtMeta } from "../../lib/formats";

const ICONS: Record<string, LucideIcon> = {
  pdf: FileType,
  docx: FileType,
  doc: FileType,
  md: FileText,
  txt: FileText,
  rtf: FileText,
  html: Code,
  pptx: FileType,
  ppt: FileType,
  xlsx: FileSpreadsheet,
  xls: FileSpreadsheet,
  csv: FileSpreadsheet,
  epub: BookOpen,
  odt: FileType,
  json: Code,
};

export function FormatCard({
  fmt,
  selected,
  disabled,
  onClick,
}: {
  fmt: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const m = fmtMeta(fmt);
  const Icon = ICONS[fmt] ?? FileType;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex w-full flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition ${
        selected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-900"
          : disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-50 dark:border-slate-800 dark:bg-slate-900"
            : `cursor-pointer border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700`
      }`}
    >
      <div className={`grid h-10 w-10 place-items-center rounded-lg border ${m.bg}`}>
        <Icon className={`h-5 w-5 ${m.color}`} />
      </div>
      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {m.label}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">
        .{m.ext}
      </div>
      {selected && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </button>
  );
}

export function FormatGrid({
  formats,
  selected,
  onSelect,
  disabledSet,
}: {
  formats: string[];
  selected: string | null;
  onSelect: (fmt: string) => void;
  disabledSet?: Set<string>;
}) {
  const ordered = [...formats].sort((a, b) => {
    const order = ["pdf", "docx", "md", "html", "pptx", "xlsx", "epub", "odt", "rtf", "txt", "doc", "ppt", "xls", "csv", "json"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {ordered.map((f) => (
        <FormatCard
          key={f}
          fmt={f}
          selected={selected === f}
          disabled={disabledSet?.has(f)}
          onClick={() => onSelect(f)}
        />
      ))}
    </div>
  );
}
