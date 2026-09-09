import { networkInterfaces } from "node:os";
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const isTauri = process.env.TAURI === "1";

const localDevOrigins = ["127.0.0.1", "[::1]"];

const configuredDevOrigins = (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const lanDevOrigins = Object.values(networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter(({ address, family, internal }) => {
    if (family !== "IPv4" || internal) return false;
    const [first, second] = address.split(".").map(Number);
    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  })
  .map(({ address }) => address);

const baseConfig: NextConfig = {
  // standalone 输出供 Docker 多阶段构建；TAURI=1 时切换为静态导出
  output: isTauri ? "export" : "standalone",
  ...(isTauri && { images: { unoptimized: true } }),
  devIndicators: false,
  // 开发时自动允许本机回环与当前局域网 IPv4；额外域名可由未提交的环境变量补充。
  allowedDevOrigins: [
    ...new Set([...localDevOrigins, ...lanDevOrigins, ...configuredDevOrigins]),
  ],
  // 消除 Next.js 16 Turbopack 与 next-pwa webpack 配置的冲突警告
  turbopack: {},
};

export default isTauri
  ? baseConfig
  : withPWA({
      dest: "public",
      cacheOnFrontEndNav: true,
      aggressiveFrontEndNavCaching: true,
      reloadOnOnline: true,
      disable: process.env.NODE_ENV === "development",
      workboxOptions: { disableDevLogs: true },
    })(baseConfig);
