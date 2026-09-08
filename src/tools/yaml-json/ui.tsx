"use client";

import { useMemo, useState } from "react";
import yaml from "js-yaml";
import { ToolShell, ToolField } from "../../components/tools/tool-shell";
import { CopyButton } from "../../components/tools/copy-button";
import { Segmented } from "../../components/tools/segmented";
import { TextArea } from "../../components/tools/inputs";
import { ErrorBox } from "../../components/tools/error-box";
import { meta } from "./meta";

type Dir = "yaml-to-json" | "json-to-yaml";

const DIR_OPTIONS = [
  { value: "yaml-to-json", label: "YAML → JSON" },
  { value: "json-to-yaml", label: "JSON → YAML" },
] as const;

function convert(dir: Dir, input: string): { out: string; err: string } {
  if (!input.trim()) return { out: "", err: "" };
  try {
    if (dir === "yaml-to-json") {
      const obj = yaml.load(input);
      return { out: JSON.stringify(obj, null, 2), err: "" };
    } else {
      const obj = JSON.parse(input);
      return { out: yaml.dump(obj, { indent: 2, lineWidth: 120 }), err: "" };
    }
  } catch (e) {
    return { out: "", err: e instanceof Error ? e.message : String(e) };
  }
}

const PLACEHOLDER: Record<Dir, string> = {
  "yaml-to-json": "name: FMKTools\nversion: 0.1.0\ntools:\n  - base64\n  - jwt",
  "json-to-yaml": '{"name": "FMKTools", "version": "0.1.0"}',
};

export default function YamlJsonUi() {
  const [dir, setDir] = useState<Dir>("yaml-to-json");
  const [input, setInput] = useState("");

  const { out, err } = useMemo(() => convert(dir, input), [dir, input]);

  return (
    <ToolShell icon={meta.icon} title={meta.name} description={meta.description}>
      <div className="space-y-4">
        <Segmented<Dir> value={dir} onChange={setDir} options={DIR_OPTIONS} />

        <ToolField label={dir === "yaml-to-json" ? "YAML 输入" : "JSON 输入"}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDER[dir]}
            rows={10}
            className="resize-y text-xs"
            spellCheck={false}
          />
        </ToolField>

        {err ? (
          <ErrorBox>{err}</ErrorBox>
        ) : (
          <ToolField label="结果" action={<CopyButton value={out} />}>
            <TextArea
              readOnly
              value={out}
              rows={10}
              className="resize-y bg-muted text-xs"
            />
          </ToolField>
        )}
      </div>
    </ToolShell>
  );
}
