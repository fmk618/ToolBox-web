# Toolbox · Web 前端

> Toolbox 项目的浏览器端 ——「工具百宝箱」。
> 这是 [fmk618/ToolBox](https://github.com/fmk618/ToolBox) 的 `web/` 子模块；
> 大部分工具纯前端运行，仅文件转换工具依赖 Python 后端。

## ✨ 一览

- **19+ 工具**，覆盖编解码 / 加密哈希 / 文本 / 时间 / 开发 / 颜色 / 图片 等分类
- **shadcn/ui 视觉**：Geist 字体 · OKLCH 语义色令牌 · 浅深双模
- **⌘K 命令面板**：全工具搜索 + 键盘导航
- **侧栏点链导航**：每个工具自带稳定主色，圆点 + 细线串成视觉链
- **本地优先**：除文件格式转换调用后端外，所有工具完全在浏览器中执行

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

工具自身用到的库：`qrcode` · `marked` · `diff` · `js-yaml` · `cronstrue`。

## 🚀 快速开始

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm run start
```

如果要使用「文件格式转换」工具，需要后端先启动（在
[根仓库](https://github.com/fmk618/ToolBox) 执行 `uv run toolbox serve`）。
其他 18 个工具不依赖后端，可直接用。

## ⚙️ 环境变量

| 变量                    | 默认                       | 说明                       |
| ----------------------- | -------------------------- | -------------------------- |
| `NEXT_PUBLIC_API_BASE`  | `http://127.0.0.1:8000`    | 文件转换后端 API 地址       |

跨机部署时新建 `web/.env.local` 覆盖：

```bash
NEXT_PUBLIC_API_BASE=http://192.168.1.100:8000
```

> `NEXT_PUBLIC_` 前缀会被打包进客户端 JS，**不要放任何密钥**。

## 📁 目录结构

```
web/
├── public/                       # 静态资源（favicon icon.svg / wechat-qr.jpg）
├── src/
│   ├── app/
│   │   ├── layout.tsx            # 根布局 + Geist 字体 + 全局 CSS
│   │   ├── page.tsx              # 首页：按分类网格展示所有工具
│   │   ├── globals.css           # Tailwind + OKLCH 语义色令牌
│   │   ├── icon.svg              # 黑底 T 字母 favicon
│   │   └── tools/[slug]/page.tsx # 动态工具路由
│   ├── components/
│   │   ├── brand/logo.tsx        # T 字母标 + 词标
│   │   ├── shell/                # sidebar / topbar / command-palette / wechat
│   │   └── tools/                # 工具间复用的小组件（ToolShell / CopyButton）
│   ├── lib/
│   │   ├── api.ts                # 后端 API 封装（文件转换专用）
│   │   ├── jobs.tsx              # 转换队列 / 历史
│   │   ├── utils.ts              # cn() 助手（clsx + tailwind-merge）
│   │   └── tools/                # 工具公共：types / categories / manifest / colors
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

注册流程：

1. 创建文件夹 + 三件套
2. 在 `src/lib/tools/manifest.ts` 添加一行 meta import 与一行 ui 动态 import
3. 完成，新工具自动出现在侧栏、首页、命令面板

每个工具自动获得：

- 自有稳定主色（slug 哈希到 16 色调色板）
- 独立 chunk（Next.js `next/dynamic` 懒加载）
- ⌘K 全字段搜索（name / slug / description / keywords）

## 🔌 与后端的交互

仅「文件格式转换」工具使用后端，URL 命名空间 `/tools/file-convert`：

| 时机     | 方法   | 路径                              | 用途                                       |
| -------- | ------ | --------------------------------- | ------------------------------------------ |
| 工具挂载 | `GET`  | `/tools/file-convert/routes`      | 拉取格式转换图，BFS 计算可达目标            |
| 用户上传 | `POST` | `/tools/file-convert/convert?to=` | 上传文件，下载转换结果                      |
| 设置页   | `GET`  | `/settings/llm` `/providers`      | Vision-LLM 配置（PDF→Markdown 走云端模型）  |

后端在 `https://github.com/fmk618/ToolBox/blob/beta/src/toolbox/api.py` 已放开
CORS 允许 `http://localhost:3000`。

## 🎨 设计

- **品牌**：T 字母标（手写 SVG），黑底白字，深色模式自动反相
- **导航**：分类侧栏 + 工具点状彩色连接（每个工具固定颜色，激活态用自身色渲染文字与发光圆点，无灰色背景污染）
- **动画**：路由切换 fade+slide；首页卡片 stagger 入场；命令面板缩放上滑
- **快捷键**：⌘K / Ctrl+K 全局唤出命令面板

## 🗺️ 路线图

| 阶段 | 内容                                                       | 状态 |
| ---- | ---------------------------------------------------------- | ---- |
| 当前 | 19 个工具 · shadcn 视觉 · ⌘K 命令面板                       | ✅   |
| 下一波 | JSON 可视化 · 图片压缩 · SVG 优化 · Carbon 代码截图等扩展工具 | 📅   |
| 未来 | 工具收藏 / 最近使用 · 配置同步 · PWA 离线                   | 💭   |

---

更多项目级文档见 [根仓库 README](https://github.com/fmk618/ToolBox)。
