# ✨ 每日运势 Daily Luck

**本地优先的个人每日运势仪表盘** —— 八字排盘 · 分类指数 · 黄历宜忌 · 7 日趋势

你的姓名与生辰只保存在你自己的电脑里，加密入库、离线可用，不上传任何服务器。

## GitHub 仓库

[jying3040-cmd/Daily-luck](https://github.com/jying3040-cmd/Daily-luck) 是本项目的源码与文档仓库，也是查看更新、反馈问题和参与贡献的入口。应用运行时，个人档案仍保存在本机，不会因为项目托管在 GitHub 而上传。

![每日运势应用界面](docs/screenshots/dashboard.png)

## 项目目标

市面上的运势应用要么是网页小广告，要么要求你把生辰八字上传到陌生服务器。这个项目反其道而行：

1. **数据 100% 本地**：档案存入本机 SQLite，姓名与手机尾号用 AES-256-GCM 加密后才落盘；服务只监听 `127.0.0.1`，没有账号、没有上报、没有追踪。
2. **结果稳定可复现**：相同日期 + 相同档案 → 相同结果，并有测试锁定行为，不是每次刷新都变的随机数。
3. **认真对待传统历法**：基于 `lunar-typescript` 计算真实的干支历、黄历宜忌与生肖冲煞，而不是编造话术。
4. **工程完整**：TypeScript 全栈、API 集成测试、CI、Dependabot、issue 模板一应俱全，适合作为全栈参考项目阅读。

## 核心功能概览

| 功能 | 说明 |
|---|---|
| 档案管理 | 姓名、出生日期、出生时辰、手机尾号、血型与性别，本地加密保存 |
| 命盘排盘 | 八字四柱、星座、生肖、生命数字与日干五行 |
| 五项指数 | 事业、财运、感情、健康、人际，附综合分与解读 |
| 黄历宜忌 | 幸运色、幸运数字、幸运方位、贵人属相与冲煞生肖 |
| 7 日趋势 | 以今天为中心的前后三天运势曲线 |
| SQLite 缓存 | 报告按日缓存，重复访问零计算 |

### 分数是怎么生成的

Daily Luck 是**确定性的娱乐产品，不是预测模型**。相同档案与日期永远得到相同结果；界面上的整数分用于呈现相对趋势，不代表统计概率或现实事件发生率。

| 数据来源 | 在产品中的作用 | 性质 |
|---|---|---|
| `lunar-typescript` | 农历、八字、生肖、宜忌、冲煞和方位 | 历法数据与传统规则 |
| 出生日期与时辰 | 四柱、星座、生肖、生命数字与五行关系 | 传统/流行文化映射 |
| 血型、手机尾号、姓名长度 | 对分类分数施加小幅加成 | 产品自定义娱乐规则 |
| 档案与日期的哈希 | 生成稳定的基础分和少量变化 | 确定性伪随机，不是随机预测 |

五项分类先由稳定的基础分生成，再叠加上述规则，最后限制到固定区间并平均得到综合分。代码实现集中在 `server/src/fortune.ts`，可以完整审阅、修改和测试。

> 因此请把 `69` 或 `74` 理解为同一套娱乐规则下的相对高低，而不是 69% 或 74% 的「准确率」。

## 界面预览

![黄历宜忌与 7 日运势趋势](docs/screenshots/trend.png)

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3、TypeScript、Vite、Tailwind CSS 4、Lucide Icons |
| 服务端 | Node.js、Fastify、`node:sqlite` |
| 历法 | `lunar-typescript` |
| 加密 | Node `crypto`（AES-256-GCM） |
| 测试 | Node.js Test Runner、Fastify `inject()` |
| 仓库结构 | npm workspaces（`frontend` + `server`） |

## 项目目录概览

```text
.
├── .github/                 CI、Dependabot 与协作模板
├── docs/screenshots/        README 截图
├── frontend/                Vue 前端
│   └── src/
│       ├── App.vue          页面组合与状态
│       ├── components/      表单、命盘、报告、趋势图、运势签等
│       └── lib/             API 客户端与类型
├── server/                  Fastify 服务端
│   └── src/
│       ├── index.ts         服务入口
│       ├── app.ts           应用工厂与 API 路由
│       ├── app.test.ts      API 集成测试
│       ├── db.ts            建表迁移、档案读写与运势缓存
│       ├── validate.ts      API 输入校验
│       ├── fortune.ts       排盘与运势算法
│       ├── fortune-tables.ts 规则常量查找表
│       ├── crypto.ts        本地字段加密
│       ├── paths.ts         路径常量
│       └── verify.ts        运行环境自检
├── scripts/dev.mjs          跨平台开发进程启动器
├── start.bat                Windows 一键启动
├── Dockerfile               容器构建
├── render.yaml              Render 一键部署配置
└── package.json             npm workspaces 与根命令
```

## 快速启动

### 环境要求

- Node.js `22.12.0` 或更高版本
- npm `10` 或更高版本

### 方式一：Windows 一键启动

双击 `start.bat`，脚本会自动安装依赖、构建并启动应用。

### 方式二：npm

```bash
# 开发模式（前端 http://localhost:5173，API http://127.0.0.1:3000）
npm install
npm run dev

# 生产模式（单端口 http://127.0.0.1:3000，由 Fastify 同时托管前端与 API）
npm install
npm run build
npm start
```

开发模式下 Vite 会把 `/api` 请求代理到后端，按 `Ctrl+C` 可同时停止两个进程。

### 方式三：Docker

```bash
docker build -t daily-luck .
docker run --rm -p 3000:3000 -v daily-luck-data:/app/data daily-luck
```

打开 <http://127.0.0.1:3000> 即可使用，档案数据持久化在 `daily-luck-data` 卷中。

### 方式四：Render 免费层在线 Demo

仓库提供 `render.yaml`，可在 Render 上一键部署演示实例。免费实例闲置会休眠，首次打开需等 30~60 秒；演示实例未挂持久磁盘，数据仅供演示。

## 可用命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | 同时启动前后端开发服务 |
| `npm run test` | 运行服务端 API 与数据缓存测试 |
| `npm run build` | 类型检查并构建前后端 |
| `npm run verify` | 检查历法、SQLite 与 Fastify 运行环境 |
| `npm run check` | 依次运行测试、构建和环境自检 |
| `npm start` | 启动构建后的单端口生产服务 |

## 文档导航

| 文档 | 回答的问题 |
|---|---|
| [REQUIREMENTS.md](doc/REQUIREMENTS.md) | 产品要做什么、娱乐性边界在哪里 |
| [ARCHITECTURE.md](doc/ARCHITECTURE.md) | 系统怎么设计、算法怎么保证确定性 |
| [DEVELOPMENT.md](doc/DEVELOPMENT.md) | 怎么开发、测试、部署、贡献与回滚 |
| [AGENT.md](AGENT.md) | AI 在这个项目里应该怎么工作 |

## 数据与隐私

- 数据写入项目根目录的 `data/fortune.db`。
- 姓名与手机尾号使用 AES-256-GCM 加密后入库。
- 首次运行时会在 `data/secret.key` 生成本地密钥。
- `data/`、构建产物、依赖和环境文件均已加入 `.gitignore`。
- 服务默认只监听 `127.0.0.1`，且不开放跨域 API 访问。
- 请同时备份数据库与密钥；**丢失 `secret.key` 后，已加密字段无法恢复**。

> ⚠️ 不要把 `data/fortune.db`、`data/secret.key` 或真实个人资料提交到 GitHub。

## 许可

本项目采用 [MIT License](LICENSE) 开源。

---

> **免责声明**：运势与命理内容属于传统文化与娱乐范畴，仅供娱乐参考，不构成医疗、财务、法律或其他现实决策建议。
