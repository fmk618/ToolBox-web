"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { Upload } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * 通用文件拖拽/选择区 — 全站唯一实现（原先各工具复制了 6 份）。
 *
 * `accept` 传给 input[accept]，如 ".pdf" 或 ".png,.jpg,.webp"；
 * `validate` 可选，返回 false 的文件被忽略并计数提示。
 */
export function FileDropZone({
  accept,
  multiple = false,
  onFiles,
  validate,
  title,
  clickLabel = "点击选择",
  hint,
  className,
}: {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  validate?: (file: File) => boolean;
  title?: ReactNode;
  clickLabel?: string;
  hint?: ReactNode;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  function handleFiles(list: FileList | null | undefined) {
    if (!list?.length) return;
    let files = Array.from(list);
    if (validate) {
      const ok = files.filter(validate);
      const bad = files.length - ok.length;
      if (bad > 0) {
        setWarn(`${bad} 个文件不符合要求，已忽略`);
        setTimeout(() => setWarn(null), 4000);
      }
      files = ok;
    }
    if (files.length) onFiles(multiple ? files : [files[0]]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          over
            ? "border-ring bg-accent"
            : "border-border bg-muted/30 hover:border-muted-foreground/40",
        )}
      >
        <div className="grid place-items-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-background shadow-sm">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-foreground">
            {title ?? "将文件拖到此处，或 "}
            <span
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              className="cursor-pointer font-semibold text-brand hover:underline"
            >
              {clickLabel}
            </span>
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {warn && (
        <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          {warn}
        </div>
      )}
    </div>
  );
}
