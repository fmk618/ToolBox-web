"use client";

import { FileDropZone } from "../tools/file-drop-zone";
import { detectFormat, fmtMeta } from "../../lib/formats";

/** 文件转换专用的 DropArea — FileDropZone 的薄包装（按文档格式过滤）。 */
export function DropArea({
  acceptFmt,
  onFiles,
}: {
  acceptFmt: string;
  onFiles: (files: File[]) => void;
}) {
  const m = fmtMeta(acceptFmt);
  return (
    <FileDropZone
      accept={`.${m.ext}`}
      multiple
      onFiles={onFiles}
      validate={(f) => detectFormat(f.name) === acceptFmt}
      title={
        <>
          将 <span className="font-semibold">.{m.ext}</span> 文件拖到此处，或
        </>
      }
      hint="支持批量，可一次拖入多个"
    />
  );
}
