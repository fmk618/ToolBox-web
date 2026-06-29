import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { Tool } from "./types";
import { TOOLS as METAS } from "./manifest";

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
  qrcode: () => import("../../tools/qrcode/ui"),
  "yaml-json": () => import("../../tools/yaml-json/ui"),
  "text-diff": () => import("../../tools/text-diff/ui"),
  "cron-parse": () => import("../../tools/cron-parse/ui"),
  calculator: () => import("../../tools/calculator/ui"),
  "unit-convert": () => import("../../tools/unit-convert/ui"),
  pomodoro: () => import("../../tools/pomodoro/ui"),
  "image-compress": () => import("../../tools/image-compress/ui"),
  "image-convert": () => import("../../tools/image-convert/ui"),
  "pdf-merge": () => import("../../tools/pdf-merge/ui"),
  "base-convert": () => import("../../tools/base-convert/ui"),
  "text-stat": () => import("../../tools/text-stat/ui"),
  "mock-data": () => import("../../tools/mock-data/ui"),
  "svg-min": () => import("../../tools/svg-min/ui"),
  "code-screenshot": () => import("../../tools/code-screenshot/ui"),
  "loan-calc": () => import("../../tools/loan-calc/ui"),
  "pension-calc": () => import("../../tools/pension-calc/ui"),
  "date-calc": () => import("../../tools/date-calc/ui"),
  "pdf-split": () => import("../../tools/pdf-split/ui"),
  "image-inpaint": () => import("../../tools/image-inpaint/ui"),
  md5: () => import("../../tools/md5/ui"),
  "address-gen": () => import("../../tools/address-gen/ui"),
  "net-lookup": () => import("../../tools/net-lookup/ui"),
  drawio: () => import("../../tools/drawio/ui"),
  "image-to-ico": () => import("../../tools/image-to-ico/ui"),
};

// 带 dynamic() 的完整 Tool 列表 — 仅在 Client Component 中导入
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
