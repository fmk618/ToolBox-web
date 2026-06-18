import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 输出供 Docker 多阶段构建瘦身用 —— .next/standalone 自包含
  // 运行所需的最小 node_modules 子集，配合 alpine 镜像可压到 ~150MB
  output: "standalone",
  devIndicators: false,
};

export default nextConfig;
