# syntax=docker/dockerfile:1.6
#
# Toolbox 前端镜像（Next.js standalone build）
#
# 构建：
#   docker build -t toolbox-web ./web
#
# 运行：
#   docker run -p 3000:3000 \
#     -e NEXT_PUBLIC_API_BASE=https://api.example.com \
#     toolbox-web
#
# 注意：NEXT_PUBLIC_API_BASE 必须在构建期就传入（Next.js 把它内联进客户端
# bundle）。要切后端地址必须重新 build 或在容器内重写。

# ---- 阶段 1：装依赖 ----
FROM node:22-alpine AS deps
WORKDIR /app

# 复制 manifest 再安装，享受 Docker layer cache
COPY package.json package-lock.json* ./
RUN npm ci

# ---- 阶段 2：构建 ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 默认指向本地 dev 后端；生产构建时通过 --build-arg 覆盖
ARG NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
ENV NEXT_PUBLIC_API_BASE=${NEXT_PUBLIC_API_BASE}

# Next.js standalone 输出大幅瘦身（只含运行时需要的 node_modules 子集）
RUN npm run build

# ---- 阶段 3：运行 ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# 非 root 用户
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# 把 standalone 服务器、public、.next/static 拷出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
