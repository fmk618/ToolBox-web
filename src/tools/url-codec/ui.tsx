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

export default function UrlCodecUi() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");

  const output = useMemo(() => {
    if (!input) return { value: "", err: "" };
    try {
      const v =
        mode === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
      return { value: v, err: "" };
    } catch (e) {
      return { value: "", err: e instanceof Error ? e.message : String(e) };
    }
  }, [input, mode]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description} local>
      <div className="space-y-4">
        <Segmented<"encode" | "decode">
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
        />

        <ToolField label="输入">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "hello world & 你好"
                : "hello%20world%20%26%20%E4%BD%A0%E5%A5%BD"
            }
            rows={5}
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
              rows={5}
              className="resize-y bg-muted"
            />
          )}
        </ToolField>
      </div>
    </ToolShell>
  );
}
