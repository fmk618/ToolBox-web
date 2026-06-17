"use client";

import { FileText, X } from "lucide-react";

export type StagedFile = { id: string; file: File };

export function FileList({
  files,
  onRemove,
}: {
  files: StagedFile[];
  onRemove: (id: string) => void;
}) {
  if (!files.length) return null;
  return (
    <ul className="mt-4 space-y-2">
      {files.map((sf) => (
        <li
          key={sf.id}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate text-slate-700 dark:text-slate-200">
              {sf.file.name}
            </span>
            <span className="shrink-0 text-xs text-slate-400">
              {(sf.file.size / 1024).toFixed(1)} KB
            </span>
          </span>
          <button
            onClick={() => onRemove(sf.id)}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="移除"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
