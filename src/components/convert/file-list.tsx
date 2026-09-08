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
          className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm"
        >
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-foreground">
              {sf.file.name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {(sf.file.size / 1024).toFixed(1)} KB
            </span>
          </span>
          <button
            onClick={() => onRemove(sf.id)}
            className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title="移除"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
