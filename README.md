# Toolbox · Web 前端

> Toolbox 项目的浏览器端，提供拖拽式文件转换界面。这是上层 UI 壳，**所有转换逻辑都在 [../](../) 的 Python 后端**里完成。

## 🧱 技术栈

| 类别 | 选择 | 版本 |
|---|---|---|
| 框架 | Next.js (App Router) | 16 |
| UI 库 | React | 19 |
| 样式 | Tailwind CSS | 4 |
| 类型 | TypeScript | 5 |
| 构建工具 | Turbopack | 内置 |

> 没有引入 shadcn/ui、Radix、react-dropzone 等三方组件库，所有 UI 都是手写 Tailwind + 原生 HTML5 拖拽，依赖最少、首屏最小。

## 🚀 快速开始

### 前置条件

- Node.js ≥ 20
- **后端服务已在 :8000 端口启动**（在仓库根目录执行 `uv run toolbox serve`）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开 <http://localhost:3000> 即可。页面会监听文件变更自动热更新。

### 生产构建

```bash
npm run build    # 编译
npm run start    # 启动生产服务
```

## ⚙️ 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `http://127.0.0.1:8000` | 后端 Toolbox API 地址 |

如果后端跑在别的机器或端口，在仓库根目录建一个 `.env.local`：

```bash
# web/.env.local
NEXT_PUBLIC_API_BASE=http://192.168.1.100:8000
```

> `NEXT_PUBLIC_` 前缀的变量会被打包进客户端 JS，**不要放任何密钥**。

## 📁 目录结构

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # 根布局 + 元数据 + 全局 CSS
│   │   ├── page.tsx         # 主页：拖拽 + 格式选择 + 调用 /convert
│   │   └── globals.css      # Tailwind 入口
│   └── lib/
│       └── api.ts           # 后端 API 封装 + 格式映射 + BFS 找可达目标
├── public/                  # 静态资源
├── next.config.ts           # Next.js 配置
├── tsconfig.json
└── package.json
```

## 🔌 与后端的交互

前端只调用三个接口：

| 时机 | 方法 | 路径 | 用途 |
|---|---|---|---|
| 页面挂载 | `GET` | `/routes` | 拉取全部可用转换边，用于过滤目标格式下拉框 |
| 用户上传 | — | — | 浏览器本地识别扩展名 → 计算可达目标列表（BFS） |
| 点"转换" | `POST` | `/convert?to=<fmt>` | 上传文件，下载返回的转换结果 |

后端必须放开 CORS 允许 `http://localhost:3000` 访问，这部分已在 `../src/toolbox/api.py` 里配置好。

### 添加新支持的格式

**不用改前端**。在后端的 `engines/` 里给某个引擎新增一条 `(from, to)` 边，重启后端后，前端下次拉 `/routes` 时会自动看到新格式。

## 🎨 UI 设计原则

- **零认知负担**：拖文件 → 选目标 → 点按钮，三步完成
- **动态过滤**：只显示**当前后端环境真能完成**的目标格式（基于 `/routes`）
- **状态可见**：识别出的源格式、文件大小、转换中/成功/失败全部明示
- **暗色模式**：跟随系统偏好自动切换

## 🐛 常见问题

**Q: 页面上提示「无法连接后端」**

A: 后端没启动。在仓库根目录执行：

```bash
cd ..
uv run toolbox serve
```

**Q: 选择某些目标格式时提示"没有可用引擎"**

A: 对应的系统工具没装。例如要从 PDF 转 Word，需要在系统里装 pandoc：

```bash
brew install pandoc
```

完整工具清单见[项目根目录 README](../README.md#2-安装可选系统工具按需)。

**Q: 转换大文件慢/卡住**

A: 当前 M2 版本是同步上传 + 同步处理 + 同步下载，没有进度推送和任务队列。计划在后续版本加入：

- 流式上传进度
- 服务端任务队列 + 轮询/SSE 进度
- 批量上传

## 🗺️ 路线图

| 版本 | 内容 | 状态 |
|---|---|---|
| M2.0 | 基础拖拽转换（当前） | ✅ |
| M2.1 | 批量上传 + 队列 + 进度条 | 📅 |
| M2.2 | 历史记录 + 一键重做 | 💭 |
| M3 | 套 Tauri 壳输出桌面端，复用本前端 | 📅 |

---

更多项目级文档见 [仓库根目录 README](../README.md)。
