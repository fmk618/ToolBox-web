import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const isTauri = process.env.TAURI === "1";

const baseConfig: NextConfig = {
  // standalone 输出供 Docker 多阶段构建；TAURI=1 时切换为静态导出
  output: isTauri ? "export" : "standalone",
  ...(isTauri && { images: { unoptimized: true } }),
  devIndicators: false,
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
