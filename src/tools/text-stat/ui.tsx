"use client";

import { useState } from "react";
import { ToolShell } from "../../components/tools/tool-shell";
import { meta } from "./meta";

function analyse(text: string) {
  const chars         = text.length;
  const charsNoSpace  = text.replace(/\s/g, "").length;
  const chinese       = (text.match(/[一-鿿]/g) ?? []).length;
  const lines         = text === "" ? 0 : text.split("\n").length;
  const paragraphs    = text.trim() === "" ? 0 : text.trim().split(/\n{2,}/).length;
  // word count: split on whitespace, exclude pure punctuation tokens
  const enWords = text.trim() === ""
    ? 0
    : (text.match(/[a-zA-Z'-]+/g) ?? []).length;
  // reading time: 300 Chinese chars/min, 200 English words/min
  const readSec = Math.round((chinese / 300 + enWords / 200) * 60);
  const readLabel =
    readSec < 60
      ? `< 1 分钟`
      : `约 ${Math.ceil(readSec / 60)} 分钟`;

  return { chars, charsNoSpace, chinese, enWords, lines, paragraphs, readLabel };
}

export default function TextStatUi() {
  const [text, setText] = useState("");
  const s = analyse(text);

  const CARDS = [
    { label: "总字符（含空格）",   value: s.chars },
    { label: "总字符（不含空格）", value: s.charsNoSpace },
    { label: "中文字符",           value: s.chinese },
    { label: "英文单词",           value: s.enWords },
    { label: "行数",               value: s.lines },
    { label: "段落",               value: s.paragraphs },
  ];

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="粘贴或输入文字…"
          rows={9}
          className="w-full resize-y rounded-md border border-input bg-muted/50 px-3 py-2 text-sm focus:border-ring focus:bg-background focus:outline-none"
          spellCheck={false}
        />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CARDS.map((c) => (
            <div key={c.label} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground">{c.label}</div>
              <div className="mt-0.5 font-mono text-xl font-semibold tabular-nums">{c.value}</div>
            </div>
          ))}
          <div className="col-span-2 rounded-lg border border-border bg-card px-3 py-2.5 sm:col-span-1">
            <div className="text-[10px] text-muted-foreground">预计阅读时间</div>
            <div className="mt-0.5 text-xl font-semibold">{s.readLabel}</div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
