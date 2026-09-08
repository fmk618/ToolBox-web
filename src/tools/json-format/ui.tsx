"use client";

import { useMemo, useState } from "react";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { TextArea } from "../../components/tools/inputs";
import { Segmented } from "../../components/tools/segmented";
import { ErrorBox } from "../../components/tools/error-box";
import { CopyButton } from "../../components/tools/copy-button";
import { meta } from "./meta";

export default function JsonFormatUi() {
  const [input, setInput] = useState("");
  const [indent, setIndent] = useState<2 | 4>(2);

  const result = useMemo(() => {
    if (!input.trim()) return { pretty: "", minified: "", err: "" };
    try {
      const parsed: unknown = JSON.parse(input);
      return {
        pretty: JSON.stringify(parsed, null, indent),
        minified: JSON.stringify(parsed),
        err: "",
      };
    } catch (e) {
      return {
        pretty: "",
        minified: "",
        err: e instanceof Error ? e.message : String(e),
      };
    }
  }, [input, indent]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <ToolField label="输入 JSON">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"hello":"world"}'
            rows={8}
            className="resize-y text-xs"
            spellCheck={false}
          />
        </ToolField>

        {result.err ? (
          <ErrorBox>{result.err}</ErrorBox>
        ) : (
          <>
            <ToolField
              label="美化输出"
              action={
                <>
                  <Segmented<"2" | "4">
                    value={String(indent) as "2" | "4"}
                    onChange={(v) => setIndent(Number(v) as 2 | 4)}
                    options={[{ value: "2", label: "2 空格" }, { value: "4", label: "4 空格" }]}
                  />
                  <CopyButton value={result.pretty} />
                </>
              }
            >
              <TextArea
                readOnly
                value={result.pretty}
                rows={10}
                className="resize-y bg-muted text-xs"
              />
            </ToolField>
            <ToolField
              label="压缩"
              action={<CopyButton value={result.minified} />}
            >
              <TextArea
                readOnly
                value={result.minified}
                rows={3}
                className="resize-y bg-muted text-xs"
              />
            </ToolField>
          </>
        )}
      </div>
    </ToolShell>
  );
}
