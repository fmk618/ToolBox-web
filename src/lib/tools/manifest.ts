import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Tool } from "./types";

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

type LazyUi = () => Promise<{ default: ComponentType }>;

const UI_LOADERS: Record<string, LazyUi> = {
  base64: () => import("../../tools/base64/ui"),
  "url-codec": () => import("../../tools/url-codec/ui"),
  "json-format": () => import("../../tools/json-format/ui"),
  hash: () => import("../../tools/hash/ui"),
  uuid: () => import("../../tools/uuid/ui"),
  timestamp: () => import("../../tools/timestamp/ui"),
  color: () => import("../../tools/color/ui"),
  "file-convert": () => import("../../tools/file-convert/ui"),
  settings: () => import("../../tools/system-settings/ui"),
  "regex-test": () => import("../../tools/regex-test/ui"),
  "html-entity": () => import("../../tools/html-entity/ui"),
  password: () => import("../../tools/password/ui"),
  "jwt-decode": () => import("../../tools/jwt-decode/ui"),
  timezone: () => import("../../tools/timezone/ui"),
  "color-contrast": () => import("../../tools/color-contrast/ui"),
};

const METAS = [
  fileConvert,
  base64,
  urlCodec,
  htmlEntity,
  jsonFormat,
  regexTest,
  hash,
  password,
  jwtDecode,
  uuid,
  timestamp,
  timezone,
  color,
  colorContrast,
  systemSettings,
];

export const TOOLS: Tool[] = METAS.map((m) => ({
  ...m,
  component: dynamic(UI_LOADERS[m.slug], {
    loading: () => null,
    ssr: false,
  }),
}));

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function searchTools(query: string): Tool[] {
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
  const map = new Map<string, Tool[]>();
  for (const t of TOOLS) {
    if (!map.has(t.category)) map.set(t.category, []);
    map.get(t.category)!.push(t);
  }
  return map;
}
