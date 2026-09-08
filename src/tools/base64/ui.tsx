"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Segmented } from "../../components/tools/segmented";
import { TextArea } from "../../components/tools/inputs";
import { ErrorBox } from "../../components/tools/error-box";
import { meta } from "./meta";

const MODE_OPTIONS = [
  { value: "encode", label: "编码" },
  { value: "decode", label: "解码" },
] as const;

function encode(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return "";
  }
}

function decode(
  text: string,
): { ok: true; value: string } | { ok: false; err: string } {
  try {
    return { ok: true, value: decodeURIComponent(escape(atob(text.trim()))) };
  } catch (e) {
    return { ok: false, err: e instanceof Error ? e.message : String(e) };
  }
}

export default function Base64Ui() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return { value: "", err: "" };
    if (mode === "encode") return { value: encode(input), err: "" };
    const r = decode(input);
    return r.ok
      ? { value: r.value, err: "" }
      : { value: "", err: "不是有效的 Base64" };
  }, [input, mode]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <Segmented<"encode" | "decode">
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
        />
        <ToolField label={mode === "encode" ? "输入文本" : "输入 Base64"}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "encode" ? "Hello, world" : "SGVsbG8sIHdvcmxk"}
            rows={6}
            className="resize-y"
          />
        </ToolField>
        <ToolField label="结果" action={<CopyButton value={output.value} />}>
          {output.err ? (
            <ErrorBox>{output.err}</ErrorBox>
          ) : (
            <TextArea
              readOnly
              value={output.value}
              rows={6}
              className="resize-y bg-muted"
            />
          )}
        </ToolField>
      </div>
    </ToolShell>
  );
}
