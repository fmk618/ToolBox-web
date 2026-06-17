"use client";

import { Upload } from "lucide-react";
import { useState, type DragEvent } from "react";
import { detectFormat, fmtMeta } from "../../lib/formats";

export function DropArea({
  acceptFmt,
  onFiles,
}: {
  acceptFmt: string;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const m = fmtMeta(acceptFmt);

  function handleFiles(list: FileList | null | undefined) {
    if (!list) return;
    const ok: File[] = [];
    const bad: string[] = [];
    Array.from(list).forEach((f) => {
      if (detectFormat(f.name) === acceptFmt) {
        ok.push(f);
      } else {
        bad.push(f.name);
      }
    });
    if (bad.length) {
      setWarn(`${bad.length} 个文件不是 ${m.label} 格式，已忽略`);
      setTimeout(() => setWarn(null), 4000);
    }
    if (ok.length) onFiles(ok);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-10 text-center transition ${
          over
            ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <div className="grid place-items-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white shadow-sm dark:bg-slate-800">
            <Upload className="h-5 w-5 text-slate-500" />
          </div>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
            将{" "}
            <span className="font-semibold">.{m.ext}</span> 文件拖到此处
          </p>
          <p className="mt-1 text-xs text-slate-400">支持批量，可一次拖入多个</p>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            选择文件
            <input
              type="file"
              multiple
              accept={`.${m.ext}`}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </label>
        </div>
      </div>
      {warn && (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {warn}
        </div>
      )}
    </>
  );
}
