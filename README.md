# FMKTools · Web 前端

> FMKTools 的浏览器端 —— 本地优先的常用小工具集合「工具百宝箱」。
> 这是 [fmk618/ToolBox](https://github.com/fmk618/ToolBox) 的 `web/` 子模块；
> 绝大多数工具纯前端运行，仅文件格式转换 / 图片修复依赖 Python 后端。

## ✨ 一览

- **74 个工具**，覆盖编解码 / 加密哈希 / 文本数据 / 时间 / 开发 / 颜色 / 图片 / 网络等分类
- **语义色令牌**：OKLCH 设计变量 · 浅深双模 · 统一六件套表单组件
- **⌘K 命令面板**：全工具搜索 + 键盘导航
- **侧栏点链导航**：每个工具自带稳定主色，圆点 + 细线串成视觉链
- **本地优先**：除文件转换 / 图片修复依赖 Python 后端外，其余工具均在浏览器端处理；需要联网的工具会明确说明发送的数据

## 🧱 技术栈

| 类别       | 选择                              | 版本   |
| ---------- | --------------------------------- | ------ |
| 框架       | Next.js (App Router)              | 16     |
| UI         | React + Tailwind v4 + 自建组件     | 19 / 4 |
| 字体       | Geist Sans / Mono                 | 1.x    |
| 动画       | Framer Motion                     | 12.x   |
| 命令面板   | cmdk + Radix Dialog               | 1.x    |
| 图标       | lucide-react + 内联品牌 SVG       | 1.x    |
| 类型       | TypeScript                        | 5      |
| 工具库     | clsx · tailwind-merge             | —      |

工具自身用到的库：`qrcode` · `diff` · `js-yaml` · `cronstrue` · `regexp-tree` ·
`highlight.js` · `html-to-image` · `pdf-lib` · `browser-image-compression` · `marked` · `dompurify` · `jsbarcode`。

大型编辑器工具使用 `@excalidraw/excalidraw`、`@univerjs/presets` / `@univerjs/preset-sheets-core` 和 `mind-elixir`，均在浏览器内懒加载；白板、表格和思维导图支持各自公开 JSON 快照的导入与导出，不启用云端协作，也不会自动保存，离开页面前请先导出快照。

## 🚀 快速开始

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
```

如果要使用「文件格式转换」「图片修复」工具，需要后端先启动（在
[根仓库](https://github.com/fmk618/ToolBox) 执行 `uv run toolbox serve`）。
其余工具不依赖后端，可直接用。

## ⚙️ 环境变量

| 变量                    | 默认                       | 说明                       |
| ----------------------- | -------------------------- | -------------------------- |
| `NEXT_PUBLIC_API_BASE`       | `/api`                     | 后端 API 地址（同源反代时无需配置） |
| `NEXT_PUBLIC_DRAWIO_EMBED_HOST` | `https://embed.diagrams.net` | 流程图编辑器地址；生产环境可替换为自托管的官方发行版。页面会请求 `offline=1` 禁用云存储功能 |

优先级：**系统设置页里用户自定义的地址（存 localStorage）> 构建期 `NEXT_PUBLIC_API_BASE` > 同源 `/api`**。
改设置即时生效，无需刷新。

跨机开发时新建 `web/.env.local` 覆盖：

```bash
NEXT_PUBLIC_API_BASE=http://192.168.1.100:8000
```

> 流程图编辑器默认使用上游托管地址，因此图表数据会发送到该编辑器主机；如需本地部署，请运行经过审核的官方发行版（例如自托管服务）并将 `NEXT_PUBLIC_DRAWIO_EMBED_HOST` 指向它。项目不会用 CSS 遮挡或删除编辑器内部的第三方归属信息。
>
> `NEXT_PUBLIC_` 前缀会被打包进客户端 JS，**不要放任何密钥**。

## 📁 目录结构

```
web/
├── public/                       # 静态资源（favicon icon.svg / wechat-qr.jpg）
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局 + Geist 字体 + 全局标题模板
│   │   ├── page.tsx              # 首页：按分类网格展示所有工具
│   │   ├── globals.css           # Tailwind + OKLCH 语义色令牌
│   │   ├── icon.svg              # FMKTools 几何 T 标 favicon
│   │   └── tools/[slug]/page.tsx # 动态工具路由（SSG + 独立标题/描述）
│   ├── components/
│   │   ├── brand/logo.tsx        # 几何 T 标 + FMKTools 词标
│   │   ├── shell/                # sidebar / topbar / command-palette / wechat
│   │   ├── convert/              # 文件转换专区组件
│   │   └── tools/                # 全站复用六件套：
│   │                             #   ToolShell / Button / Segmented / ErrorBox /
│   │                             #   TextArea+TextField / FileDropZone（另有 CopyButton）
│   ├── lib/
│   │   ├── api.ts                # 后端 API 封装（getApiBase() 按调用时解析地址）
│   │   ├── jobs.tsx              # 转换队列（并发 2 · 轮询超时/容错 · 历史记录）
│   │   ├── tools/                # registry.ts（唯一注册点）/ manifest / categories / colors
│   │   ├── use-local-state.ts    # localStorage hook（write-through）
│   │   ├── create-local-store.ts # favorites / recents / history / llm-config 的底层工厂
│   │   ├── use-debounced-value.ts# 输入防抖
│   │   ├── download.ts           # blob/dataURL/text 三种下载
│   │   ├── utils.ts              # cn() 助手（clsx + tailwind-merge）
│   │   └── format.ts · id.ts     # fmtSize / newId
│   └── tools/                    # 每个工具一个文件夹（见下文）
└── package.json
```

## 🛠️ 工具开发约定

每个工具都是一个独立文件夹，结构如下：

```
src/tools/<slug>/
├── meta.ts           # 静态元数据：slug / name / category / icon / description / keywords
├── ui.tsx            # React 组件（default export，懒加载）
└── lib.ts            # 可选：工具特有的纯逻辑
```

注册流程（一步）：

1. 创建文件夹 + 三件套
2. 在 `src/lib/tools/registry.ts` 的 `TOOL_ENTRIES` 里加一行 `[meta, () => import("./ui")]`
3. 完成 —— 新工具自动出现在侧栏、首页、命令面板、`/tools/<slug>` 路由，
   并获得编译期保障（meta 与 loader 永远成对，漏写直接类型报错）

> `meta.slug` 必须与文件夹名一致；纯本地工具给 `ToolShell` 传 `local` 显示「不上传」徽章。

每个工具自动获得：

- 自有稳定主色（slug 哈希到 16 色调色板，`lib/tools/colors.ts`）
- 独立 chunk（`next/dynamic` 懒加载，`ssr: false`）
- ⌘K 全字段搜索（name / slug / description / keywords）

## 🔌 与后端的交互

「文件格式转换」「图片修复」两个工具使用后端：

| 时机     | 方法   | 路径                                        | 用途                             |
| -------- | ------ | ------------------------------------------- | -------------------------------- |
| 工具挂载 | `GET`  | `/tools/file-convert/routes` `/engines`     | 转换图 BFS 计算可达目标 / 引擎态 |
| 用户上传 | `POST` | `/tools/file-convert/jobs?to=`              | 建立异步任务，秒回 `job_id`      |
| 进度轮询 | `GET`  | `/tools/file-convert/jobs/{id}`             | status / progress / error        |
| 取结果   | `GET`  | `/tools/file-convert/jobs/{id}/result`      | 下载产物（带 Content-Disposition）|
| 图片修复 | `POST` | `/tools/image-inpaint/remove`               | 原图 + 蒙版 PNG，返回修复图      |
| LLM 设置 | `POST` | `/settings/llm/test` · `GET /providers`     | 密钥随请求传递，服务端不存储     |

队列行为见 `lib/jobs.tsx`：最多并发 2 个任务；轮询 300ms 一次，连续 8 次失败才判失败；
单任务 10 分钟超时释放并发槽位（防止后端挂死导致队列永久阻塞）。

---

更多项目级文档见 [根仓库 README](https://github.com/fmk618/ToolBox)。
