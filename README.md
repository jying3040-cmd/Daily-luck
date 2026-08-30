# Daily Luck · 每日运势

[![CI](https://github.com/jying3040-cmd/Daily-luck/actions/workflows/ci.yml/badge.svg)](https://github.com/jying3040-cmd/Daily-luck/actions/workflows/ci.yml)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**无需注册、数据不上传的本地每日运势 Web 应用。** 只在你的电脑上保存个人档案，并生成命盘、每日分类指数、黄历宜忌、幸运信息和 7 日趋势。

![Daily Luck 仪表盘，使用虚构演示资料](docs/assets/daily-luck-dashboard.png)

> 截图使用虚构档案。运势与命理内容属于传统文化与娱乐范畴，不构成医疗、财务、法律或其他现实决策建议。

## 为什么做成本地版

| 你关心的事 | Daily Luck 的做法 |
| --- | --- |
| 不想注册账号 | 打开本地页面即可使用 |
| 不想上传出生信息 | 服务默认只监听 `127.0.0.1` |
| 希望每天结果稳定 | 相同档案与日期会生成相同结果 |
| 担心明文数据 | 姓名与手机尾号使用 AES-256-GCM 加密后写入 SQLite |
| 想查看短期变化 | 一次展示今天前后共 7 天的趋势 |

## 最快本地体验

需要 Node.js `22.12.0` 或更高版本。

```bash
git clone https://github.com/jying3040-cmd/Daily-luck.git
cd Daily-luck
npm ci
npm run build
npm start
```

然后打开 <http://127.0.0.1:3000>。

Windows 用户也可以克隆或下载项目后双击 `start.bat`；脚本会安装依赖、构建并启动应用。

> 当前版本是面向本地运行的开发者预览版，尚未提供在线 Demo、桌面安装包或免安装版本。首次安装耗时取决于网络与 npm 下载速度。

## 你会得到什么

- 八字四柱、星座、生肖、生命数字与日干五行
- 综合分及事业、财运、感情、健康、人际五项指数
- 黄历宜忌、幸运色、数字、方位、贵人属相与冲煞生肖
- 以今天为中心的 7 日运势趋势
- 本地 SQLite 缓存，同一天重复打开无需重新计算

## 分数是怎么生成的

Daily Luck 是确定性的娱乐产品，不是预测模型。同一档案与日期会得到相同结果；界面中的整数分数用于呈现相对趋势，不代表统计概率或现实事件发生率。

| 数据来源 | 在产品中的作用 | 性质 |
| --- | --- | --- |
| `lunar-typescript` | 农历、八字、生肖、宜忌、冲煞和方位 | 历法数据与传统规则 |
| 出生日期与时间 | 四柱、星座、生肖、生命数字与五行关系 | 传统/流行文化映射 |
| 血型、手机尾号、姓名长度 | 对分类分数施加小幅加减 | 产品自定义娱乐规则 |
| 档案与日期的哈希 | 生成稳定的基础分和少量变化 | 确定性伪随机，不是随机预测 |

五个分类先由稳定的基础分生成，再叠加上述规则，最后限制到固定区间并取平均得到综合分。代码实现集中在 [`server/src/fortune.ts`](server/src/fortune.ts)，可以完整审阅、修改和测试。

因此，请把 `69` 与 `74` 理解为同一套娱乐规则下的相对高低，而不是 69% 或 74% 的“准确率”。任何健康、财务、情感或职业决定都不应依赖这些结果。

## 开发

```bash
npm ci
npm run dev
```

- 前端开发服务：<http://localhost:5173>
- 后端 API：<http://127.0.0.1:3000>
- Vite 会将 `/api` 请求代理到后端；按 `Ctrl+C` 可同时停止两个进程

### 可用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 同时启动前后端开发服务 |
| `npm run test` | 运行服务端 API 与缓存测试 |
| `npm run build` | 类型检查并构建前后端 |
| `npm run verify` | 检查历法、SQLite 与 Fastify 运行环境 |
| `npm run check` | 依次运行测试、构建和环境自检 |
| `npm start` | 启动构建后的单端口生产服务 |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Tailwind CSS 4、Lucide Icons |
| 服务端 | Node.js、Fastify、`node:sqlite` |
| 历法 | `lunar-typescript` |
| 测试 | Node.js Test Runner、Fastify `inject()` |

## 数据与隐私

- 数据写入项目根目录的 `data/fortune.db`
- 姓名与手机尾号使用 AES-256-GCM 加密后入库
- 首次运行时在 `data/secret.key` 生成本地密钥
- `data/`、构建产物、依赖和环境文件均已加入 `.gitignore`
- 服务默认只监听 `127.0.0.1`，且不开放跨域 API 访问
- 备份时请同时保存数据库与密钥；丢失 `secret.key` 后无法恢复已加密字段

不要把 `data/fortune.db`、`data/secret.key` 或真实个人资料提交到 GitHub。

## 项目结构

```text
.
├── .github/                 # CI、Dependabot 与协作模板
├── docs/assets/             # README 演示素材
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

## License

[MIT](LICENSE)
