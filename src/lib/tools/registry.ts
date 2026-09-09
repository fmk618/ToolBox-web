import type { ComponentType } from "react";
import type { ToolMeta } from "./types";

import { meta as fileConvert } from "../../tools/file-convert/meta";
import { meta as pdfMerge } from "../../tools/pdf-merge/meta";
import { meta as pdfSplit } from "../../tools/pdf-split/meta";
import { meta as pdfOrganize } from "../../tools/pdf-organize/meta";
import { meta as base64 } from "../../tools/base64/meta";
import { meta as urlCodec } from "../../tools/url-codec/meta";
import { meta as htmlEntity } from "../../tools/html-entity/meta";
import { meta as jsonFormat } from "../../tools/json-format/meta";
import { meta as yamlJson } from "../../tools/yaml-json/meta";
import { meta as textDiff } from "../../tools/text-diff/meta";
import { meta as textStat } from "../../tools/text-stat/meta";
import { meta as regexTest } from "../../tools/regex-test/meta";
import { meta as hash } from "../../tools/hash/meta";
import { meta as md5 } from "../../tools/md5/meta";
import { meta as password } from "../../tools/password/meta";
import { meta as jwtDecode } from "../../tools/jwt-decode/meta";
import { meta as calculator } from "../../tools/calculator/meta";
import { meta as unitConvert } from "../../tools/unit-convert/meta";
import { meta as baseConvert } from "../../tools/base-convert/meta";
import { meta as mockData } from "../../tools/mock-data/meta";
import { meta as addressGen } from "../../tools/address-gen/meta";
import { meta as codeScreenshot } from "../../tools/code-screenshot/meta";
import { meta as drawio } from "../../tools/drawio/meta";
import { meta as loanCalc } from "../../tools/loan-calc/meta";
import { meta as pensionCalc } from "../../tools/pension-calc/meta";
import { meta as uuid } from "../../tools/uuid/meta";
import { meta as qrcode } from "../../tools/qrcode/meta";
import { meta as imageCompress } from "../../tools/image-compress/meta";
import { meta as imageConvert } from "../../tools/image-convert/meta";
import { meta as imageInpaint } from "../../tools/image-inpaint/meta";
import { meta as imageToIco } from "../../tools/image-to-ico/meta";
import { meta as svgMin } from "../../tools/svg-min/meta";
import { meta as timestamp } from "../../tools/timestamp/meta";
import { meta as timezone } from "../../tools/timezone/meta";
import { meta as dateCalc } from "../../tools/date-calc/meta";
import { meta as pomodoro } from "../../tools/pomodoro/meta";
import { meta as cronParse } from "../../tools/cron-parse/meta";
import { meta as netLookup } from "../../tools/net-lookup/meta";
import { meta as color } from "../../tools/color/meta";
import { meta as colorContrast } from "../../tools/color-contrast/meta";
import { meta as httpRef } from "../../tools/http-ref/meta";
import { meta as jsonToTs } from "../../tools/json-to-ts/meta";
import { meta as textBatch } from "../../tools/text-batch/meta";
import { meta as raffle } from "../../tools/raffle/meta";
import { meta as healthCalc } from "../../tools/health-calc/meta";
import { meta as exchangeRate } from "../../tools/exchange-rate/meta";
import { meta as signaturePad } from "../../tools/signature-pad/meta";
import { meta as imagePalette } from "../../tools/image-palette/meta";
import { meta as dataConvert } from "../../tools/data-convert/meta";
import { meta as sqlFormat } from "../../tools/sql-format/meta";
import { meta as qrDecode } from "../../tools/qr-decode/meta";
import { meta as exifTool } from "../../tools/exif-tool/meta";
import { meta as settings } from "../../tools/settings/meta";

export type LazyUi = () => Promise<{ default: ComponentType }>;
export type ToolEntry = readonly [meta: ToolMeta, ui: LazyUi];

/**
 * 工具注册表 — 新增 / 下线工具唯一需要改动的地方。
 *
 * 每条是 `[meta, ui loader]` 就地配对：加载路径由 meta.slug 派生，不存在
 * 第二份手写清单。漏写 loader 会在编译期报错（tuple 两项都必填），
 * meta.slug 与目录名不一致也一目了然。
 *
 * 数组顺序即侧栏 / 首页 / 命令面板的展示顺序。
 */
export const TOOL_ENTRIES: readonly ToolEntry[] = [
  [fileConvert, () => import("../../tools/file-convert/ui")],
  [pdfMerge, () => import("../../tools/pdf-merge/ui")],
  [pdfSplit, () => import("../../tools/pdf-split/ui")],
  [pdfOrganize, () => import("../../tools/pdf-organize/ui")],
  [base64, () => import("../../tools/base64/ui")],
  [urlCodec, () => import("../../tools/url-codec/ui")],
  [htmlEntity, () => import("../../tools/html-entity/ui")],
  [jsonFormat, () => import("../../tools/json-format/ui")],
  [yamlJson, () => import("../../tools/yaml-json/ui")],
  [textDiff, () => import("../../tools/text-diff/ui")],
  [textStat, () => import("../../tools/text-stat/ui")],
  [regexTest, () => import("../../tools/regex-test/ui")],
  [hash, () => import("../../tools/hash/ui")],
  [md5, () => import("../../tools/md5/ui")],
  [password, () => import("../../tools/password/ui")],
  [jwtDecode, () => import("../../tools/jwt-decode/ui")],
  [calculator, () => import("../../tools/calculator/ui")],
  [unitConvert, () => import("../../tools/unit-convert/ui")],
  [baseConvert, () => import("../../tools/base-convert/ui")],
  [mockData, () => import("../../tools/mock-data/ui")],
  [addressGen, () => import("../../tools/address-gen/ui")],
  [codeScreenshot, () => import("../../tools/code-screenshot/ui")],
  [drawio, () => import("../../tools/drawio/ui")],
  [loanCalc, () => import("../../tools/loan-calc/ui")],
  [pensionCalc, () => import("../../tools/pension-calc/ui")],
  [uuid, () => import("../../tools/uuid/ui")],
  [qrcode, () => import("../../tools/qrcode/ui")],
  [imageCompress, () => import("../../tools/image-compress/ui")],
  [imageConvert, () => import("../../tools/image-convert/ui")],
  [imageInpaint, () => import("../../tools/image-inpaint/ui")],
  [imageToIco, () => import("../../tools/image-to-ico/ui")],
  [svgMin, () => import("../../tools/svg-min/ui")],
  [timestamp, () => import("../../tools/timestamp/ui")],
  [timezone, () => import("../../tools/timezone/ui")],
  [dateCalc, () => import("../../tools/date-calc/ui")],
  [pomodoro, () => import("../../tools/pomodoro/ui")],
  [cronParse, () => import("../../tools/cron-parse/ui")],
  [netLookup, () => import("../../tools/net-lookup/ui")],
  [httpRef, () => import("../../tools/http-ref/ui")],
  [dataConvert, () => import("../../tools/data-convert/ui")],
  [sqlFormat, () => import("../../tools/sql-format/ui")],
  [jsonToTs, () => import("../../tools/json-to-ts/ui")],
  [textBatch, () => import("../../tools/text-batch/ui")],
  [raffle, () => import("../../tools/raffle/ui")],
  [healthCalc, () => import("../../tools/health-calc/ui")],
  [exchangeRate, () => import("../../tools/exchange-rate/ui")],
  [color, () => import("../../tools/color/ui")],
  [colorContrast, () => import("../../tools/color-contrast/ui")],
  [signaturePad, () => import("../../tools/signature-pad/ui")],
  [imagePalette, () => import("../../tools/image-palette/ui")],
  [qrDecode, () => import("../../tools/qr-decode/ui")],
  [exifTool, () => import("../../tools/exif-tool/ui")],
  [settings, () => import("../../tools/settings/ui")],
];

// Dev 期防呆：slug 重复 / slug ≠ 目录名时在控制台报错（生产 tree-shake 掉）。
if (process.env.NODE_ENV !== "production") {
  const seen = new Set<string>();
  for (const [m] of TOOL_ENTRIES) {
    if (seen.has(m.slug)) {
      console.error(`[tools/registry] duplicate tool slug: ${m.slug}`);
    }
    seen.add(m.slug);
  }
}
