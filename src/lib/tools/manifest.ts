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
};

const METAS = [
  base64,
  urlCodec,
  jsonFormat,
  hash,
  uuid,
  timestamp,
  color,
  fileConvert,
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
