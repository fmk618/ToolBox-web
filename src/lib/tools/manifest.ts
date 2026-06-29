import type { ToolMeta } from "./types";

import { meta as base64 } from "../../tools/base64/meta";
import { meta as urlCodec } from "../../tools/url-codec/meta";
import { meta as jsonFormat } from "../../tools/json-format/meta";
import { meta as hash } from "../../tools/hash/meta";
import { meta as uuid } from "../../tools/uuid/meta";
import { meta as timestamp } from "../../tools/timestamp/meta";
import { meta as color } from "../../tools/color/meta";
import { meta as fileConvert } from "../../tools/file-convert/meta";
import { meta as systemSettings } from "../../tools/system-settings/meta";
import { meta as regexTest } from "../../tools/regex-test/meta";
import { meta as htmlEntity } from "../../tools/html-entity/meta";
import { meta as password } from "../../tools/password/meta";
import { meta as jwtDecode } from "../../tools/jwt-decode/meta";
import { meta as timezone } from "../../tools/timezone/meta";
import { meta as colorContrast } from "../../tools/color-contrast/meta";
import { meta as qrcode } from "../../tools/qrcode/meta";
import { meta as yamlJson } from "../../tools/yaml-json/meta";
import { meta as textDiff } from "../../tools/text-diff/meta";
import { meta as cronParse } from "../../tools/cron-parse/meta";
import { meta as calculator } from "../../tools/calculator/meta";
import { meta as unitConvert } from "../../tools/unit-convert/meta";
import { meta as pomodoro } from "../../tools/pomodoro/meta";
import { meta as imageCompress } from "../../tools/image-compress/meta";
import { meta as imageConvert } from "../../tools/image-convert/meta";
import { meta as pdfMerge } from "../../tools/pdf-merge/meta";
import { meta as baseConvert } from "../../tools/base-convert/meta";
import { meta as textStat } from "../../tools/text-stat/meta";
import { meta as mockData } from "../../tools/mock-data/meta";
import { meta as svgMin } from "../../tools/svg-min/meta";
import { meta as codeScreenshot } from "../../tools/code-screenshot/meta";
import { meta as loanCalc } from "../../tools/loan-calc/meta";
import { meta as dateCalc } from "../../tools/date-calc/meta";
import { meta as pdfSplit } from "../../tools/pdf-split/meta";
import { meta as imageInpaint } from "../../tools/image-inpaint/meta";

// 纯静态元数据，不含 dynamic() — 可被 Server Component 安全导入
export const TOOLS: ToolMeta[] = [
  fileConvert,
  pdfMerge,
  pdfSplit,
  base64,
  urlCodec,
  htmlEntity,
  jsonFormat,
  yamlJson,
  textDiff,
  textStat,
  regexTest,
  hash,
  password,
  jwtDecode,
  calculator,
  unitConvert,
  baseConvert,
  mockData,
  codeScreenshot,
  loanCalc,
  uuid,
  qrcode,
  imageCompress,
  imageConvert,
  imageInpaint,
  svgMin,
  timestamp,
  timezone,
  dateCalc,
  pomodoro,
  cronParse,
  color,
  colorContrast,
  systemSettings,
];

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return TOOLS;
  return TOOLS.filter((t) => {
    if (t.name.toLowerCase().includes(q)) return true;
    if (t.description.toLowerCase().includes(q)) return true;
    if (t.slug.includes(q)) return true;
    return (t.keywords ?? []).some((k) => k.toLowerCase().includes(q));
  });
}

export function toolsByCategory() {
  const map = new Map<string, ToolMeta[]>();
  for (const t of TOOLS) {
    if (!map.has(t.category)) map.set(t.category, []);
    map.get(t.category)!.push(t);
  }
  return map;
}
