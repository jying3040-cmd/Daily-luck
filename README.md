# 每日运势

一个本地优先的每日运势 Web 应用。它根据个人资料生成命盘、每日分类指数、黄历宜忌、幸运信息和 7 日趋势。

> 运势与命理内容属于传统文化与娱乐范畴，仅供娱乐参考，不构成医疗、财务、法律或其他现实决策建议。

## 功能

- 本地保存姓名、出生日期、出生时辰、手机尾号、血型与性别
- 展示八字四柱、星座、生肖、生命数字与日干五行
- 生成综合分及事业、财运、感情、健康、人际五项指数
- 展示黄历宜忌、幸运色、数字、方位、贵人属相与冲煞生肖
- 查看以今天为中心的 7 日运势趋势
- 相同日期和档案产生稳定结果，并使用 SQLite 缓存报告

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Tailwind CSS 4、Lucide Icons |
| 服务端 | Node.js、Fastify、`node:sqlite` |
| 历法 | `lunar-typescript` |
| 测试 | Node.js Test Runner、Fastify `inject()` |

## 快速开始

### 环境要求

- Node.js `22.12.0` 或更高版本
- npm `10` 或更高版本

### 开发模式

```bash
npm install
npm run dev
```

- 前端开发服务：<http://localhost:5173>
- 后端 API：<http://127.0.0.1:3000>

Vite 会将 `/api` 请求代理到后端。按 `Ctrl+C` 可同时停止两个进程。

### 生产模式

```bash
npm install
npm run build
npm start
```

打开 <http://127.0.0.1:3000>。生产模式由 Fastify 在同一端口托管前端与 API，不需要额外启动 Vite。

Windows 用户也可以双击 `start.bat`，脚本会安装依赖、构建并启动应用。

## 可用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 同时启动前后端开发服务 |
| `npm run test` | 运行服务端 API 与数据缓存测试 |
| `npm run build` | 类型检查并构建前后端 |
| `npm run verify` | 检查历法、SQLite 与 Fastify 运行环境 |
| `npm run check` | 依次运行测试、构建和环境自检 |
| `npm start` | 启动构建后的单端口生产服务 |

## 数据与隐私

- 数据写入项目根目录的 `data/fortune.db`。
- 姓名与手机尾号使用 AES-256-GCM 加密后入库。
- 首次运行时会在 `data/secret.key` 生成本地密钥。
- `data/`、构建产物、依赖和环境文件均已加入 `.gitignore`。
- 服务默认只监听 `127.0.0.1`，且不开放跨域 API 访问。
- 请同时备份数据库与密钥；丢失 `secret.key` 后，已加密字段无法恢复。

不要把 `data/fortune.db`、`data/secret.key` 或真实个人资料提交到 GitHub。

## 项目结构

```text
.
├── .github/                 # CI、Dependabot 与协作模板
├── frontend/                # Vue 前端
│   └── src/
├── server/                  # Fastify 服务端
│   └── src/
│       ├── app.ts           # 应用工厂、数据库与 API
│       ├── app.test.ts      # API 集成测试
│       ├── fortune.ts       # 排盘与运势规则
│       └── crypto.ts        # 本地字段加密
├── scripts/dev.mjs          # 跨平台开发进程启动器
├── start.bat                # Windows 一键启动
└── package.json             # npm workspaces 与根命令
```

## API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/health` | 服务健康检查 |
| `GET` | `/api/today` | 历法引擎探测 |
| `GET` | `/api/profile` | 读取档案与命盘 |
| `PUT` | `/api/profile` | 校验并保存档案 |
| `GET` | `/api/reports?start=YYYY-MM-DD&end=YYYY-MM-DD` | 获取最多 366 天报告 |

## 参与贡献

提交改动前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，并至少运行：

```bash
npm run check
npm audit --audit-level=high
```

安全问题请按 [SECURITY.md](SECURITY.md) 中的方式私下报告。

## 许可

本项目采用 [MIT License](LICENSE) 开源。
