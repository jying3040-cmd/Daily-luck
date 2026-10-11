# DEVELOPMENT.md — 开发、测试、部署与维护

> 本文回答：这个项目**应该怎么继续开发**。
> 系统设计见 `ARCHITECTURE.md`，业务规则见 `REQUIREMENTS.md`。
> 本文件同时归并了原「贡献指南」与「安全政策」的内容。

## 1. 开发环境

| 项 | 要求 |
|---|---|
| Node.js | **`22.12.0` 或更高版本**（`engines` 约束） |
| npm | **`10` 或更高版本** |
| 数据库 | `node:sqlite`（Node 内置，**无需安装**） |
| 加密 | Node 内置 `crypto` |
| 操作系统 | 跨平台（Windows / macOS / Linux）；提供 `start.bat` 供 Windows 一键启动 |
| 仓库结构 | npm workspaces（`frontend` + `server`） |

## 2. 安装与启动

### 开发模式

```bash
npm install
npm run dev
```

- 前端：<http://localhost:5173>
- API：<http://127.0.0.1:3000>
- Vite 会把 `/api` 代理到后端，因此前端走同源请求。
- 按 `Ctrl+C` 可同时停止两个进程（`scripts/dev.mjs` 统一管理子进程）。

### 生产模式

```bash
npm install
npm run build
npm start
```

单端口 <http://127.0.0.1:3000>，由 Fastify 同时托管前端与 API。

### Windows 一键启动

双击 `start.bat`：脚本会检查 `node_modules`（缺失则安装）、执行构建、打开浏览器并启动服务。

## 3. 环境变量

| 变量 | 用途 | 必须 | 敏感 |
|---|---|---|---|
| `HOST` | 监听地址，默认 `127.0.0.1` | 否 | 否 |
| `PORT` | 监听端口，默认 `3000`；必须是 1–65535 的整数 | 否 | 否 |
| `NODE_ENV` | Docker 镜像中设为 `production` | 否 | 否 |

**本项目没有密钥类环境变量。** 源码运行时，加密密钥由程序首次运行时生成到 `data/secret.key`（权限 `0600`）；Windows EXE 版生成到 `%LOCALAPPDATA%\DailyLuck\data\secret.key`。

`.gitignore` 已忽略 `.env` 与 `.env.local`；**不要提交任何环境文件**。

> ⚠️ 改变 `HOST` 默认值前必须先说明风险：默认只监听回环地址是本项目的安全基线。

## 4. 目录规范

| 位置 | 放什么 |
|---|---|
| `frontend/src/App.vue` | 页面组合与顶层状态 |
| `frontend/src/components/` | 可复用展示组件（一个组件一个文件） |
| `frontend/src/lib/` | API 客户端与共享类型 |
| `server/src/index.ts` | 进程入口，保持薄 |
| `server/src/app.ts` | 路由与应用装配 |
| `server/src/fortune.ts` | 排盘与运势算法（流程） |
| `server/src/fortune-tables.ts` | 规则常量（数据） |
| `server/src/db.ts` | 建表、迁移与两个存储 |
| `server/src/crypto.ts` | 加解密 |
| `server/src/validate.ts` | 输入校验守卫 |
| `server/src/paths.ts` | 路径常量单一来源 |
| `server/src/verify.ts` | 环境自检 |
| `server/src/*.test.ts` | 与被测模块同目录的测试 |
| `scripts/` | 开发与工具脚本 |
| `docs/screenshots/` | README 使用的截图 |
| `data/` | 源码运行数据（**已忽略，不提交**）；Windows EXE 版使用 `%LOCALAPPDATA%\DailyLuck\data` |

### 新增文件判断

- 新页面区块 → `frontend/src/components/`，由 `App.vue` 组合。
- 新 API → 加在 `server/src/app.ts`，校验逻辑加到 `server/src/validate.ts`。
- 新运势规则常量 → 加到 `server/src/fortune-tables.ts`，不要在 `fortune.ts` 中硬编码。
- 新测试 → 与被测模块同目录，命名 `*.test.ts`。

## 5. 编码规范

### 命名

- 文件：小写，多词用连字符（`fortune-tables.ts`）；Vue 组件 PascalCase（`ProfileForm.vue`）。
- 数据库字段：小写下划线（`birth_date`、`phone_tail_enc`）。
- 类型：PascalCase（`Profile`、`Chart`、`Report`）。
- 加密字段以 `_enc` 结尾，对应 IV 以 `iv_` 开头——**命名即文档**，一眼能看出哪些字段是密文。

### 错误处理

- API 层返回结构化错误 `{ error, message }`，`message` 为中文可读信息。
- 校验失败返回 400；业务前置条件缺失返回 404（如 `NO_PROFILE`）。
- 加密失败必须抛错，**不得**静默返回错误数据或明文兜底。

### 日志规范

- 使用 Fastify 的 `logger` 选项；测试中可传 `logger: false` 保持输出干净。
- **不得**在日志中输出姓名、手机尾号等个人信息或其明文。

### 注释原则

- 注释解释「为什么」，尤其是设计取舍（如「确定性伪随机而非真随机」「明文存储出生日期的理由」）。
- 不写复述代码的注释。

### 模块依赖原则

- `app.ts` → 领域（`fortune*`）/ 存储（`db`）/ 工具（`crypto`、`paths`、`validate`）。
- `validate.ts` 与 `fortune-tables.ts` 为叶子模块，不依赖其他业务模块。
- `db.ts` 只依赖 `crypto` 与 `paths`，不依赖路由。

### 确定性纪律

- 不得在 `fortune.ts` 中引入 `Math.random()`、`Date.now()` 或任何与请求时间相关的输入。
- 新增规则必须保持「同输入 → 同输出」。

### 数据与隐私

- 测试中只使用**虚构数据**。
- 不要把 `data/fortune.db`、`data/secret.key`、Windows EXE 版 `%LOCALAPPDATA%\DailyLuck\data` 或真实个人资料提交到仓库。
- 保持 `.gitignore` 中的 `data/`、`.env`、`dist/`、`node_modules/` 规则。

## 6. Git 分支规范

| 分支 | 职责 |
|---|---|
| 默认分支（`main`） | 可发布状态；安全更新与 CI 均针对默认分支最新版本 |
| `feature/*` | 单个功能开发 |
| `fix/*` | 缺陷修复 |

### 外部贡献流程

1. 使用 Node.js `22.12.0` 或更高版本。
2. Fork 仓库并从默认分支创建功能分支。
3. 先搜索已有 Issue，避免重复工作。
4. 大型功能或行为变更请先创建 Issue 讨论。
5. 保持改动聚焦，不要提交 `data/`、`dist/`、`node_modules/` 或任何真实个人资料。

## 7. Feature 开发流程

```text
默认分支
    ↓
创建 feature 分支
    ↓
npm install && npm run dev
    ↓
开发（改前端 / 服务端 / 规则表）
    ↓
定期同步默认分支
    ↓
npm run check            # 测试 + 构建 + 环境自检
npm audit --audit-level=high
    ↓
更新受影响的文档
    ↓
提交 PR（说明问题、实现方式、验证结果；界面改动附桌面与移动截图）
    ↓
合并回默认分支
```

长期开发的 feature 分支**必须**定期同步默认分支。

## 8. Commit 规范

```text
feat:      新功能
fix:       缺陷修复
refactor:  重构
docs:      文档变更
test:      测试
chore:     构建、依赖、杂项
```

示例：

```text
feat(fortune): 增加幸运方位规则
fix(db): 修复报告缓存主键迁移丢数据
test(fortune): 锁定同日期结果一致性
```

> 不维护独立 `CHANGELOG.md`，版本历史依赖 Git commit、tag 与 GitHub Release。

## 9. 测试规范

### 命令

```bash
npm run test       # 服务端 API 与数据缓存测试
npm run verify     # 检查历法、SQLite 与 Fastify 运行环境
npm run check      # 依次运行测试、构建和环境自检（提交前必跑）
```

### 测试方式

- 使用 **Node.js Test Runner**（`tsx --test`）与 **Fastify `inject()`**，无需启动真实端口。
- 通过 `buildApp({ databaseFile, encryptionKey, logger: false })` 注入临时数据库与固定密钥，实现完全隔离。

### 覆盖要求

| 场景 | 要求 |
|---|---|
| API 成功路径 | 每个接口的 2xx 响应 |
| API 失败路径 | 修改 API 时必须同时覆盖成功与失败路径 |
| 输入校验 | 越界日期、错误时辰格式、超长手机尾号、非法区间 |
| 无档案 | `NO_PROFILE` 分支 |
| 确定性 | 相同档案与日期多次查询结果一致 |
| 缓存 | 重复访问命中缓存 |
| 加密 | 密文与 IV 正确落盘、可解密还原 |
| 数据迁移 | 旧主键结构的自动迁移 |

### 缺陷修复

修复缺陷时**必须补充能够复现问题的测试**。

### 回归检查

每次改动后至少回归：`npm run check` 通过、`npm audit --audit-level=high` 无高危、手动走通「填档案 → 看命盘 → 看报告 → 看趋势」。

## 10. 构建

```bash
npm run build      # 前端 vue-tsc --noEmit + vite build；服务端 tsc
```

| 项 | 说明 |
|---|---|
| 构建命令 | `npm run build`（根命令，依次构建两个 workspace） |
| 构建产物 | `frontend/dist/`（静态资源）、`server/dist/`（编译后的 JS） |
| 生产启动 | `npm start` → `node server/dist/index.js` |
| 环境区别 | 不区分构建产物；通过 `HOST` / `PORT` / `NODE_ENV` 区分运行行为 |

### GitHub Release

推送 `v*` 标签会触发 `.github/workflows/release.yml`，在 Windows x64 runner 上构建并发布：

| 资产 | 适用对象与用途 |
|---|---|
| `Daily-Luck-v*-Windows-x64.exe` | Windows 10/11 64 位用户；内置 Node.js，无需单独安装运行环境，双击后打开本地页面 |
| `Daily-Luck-v*-source.zip` | 源码包；本地构建需 Node.js `22.12.0`+ 和 npm `10`+ |
| `SHA256SUMS.txt` | 校验 exe 与源码包的 SHA-256 摘要 |

打包版的档案数据库与密钥存放在 `%LOCALAPPDATA%\DailyLuck\data`。exe 未签名，首次运行时 Windows 可能显示 SmartScreen 提示。

## 11. 部署

### 本地生产模式

```bash
npm run build && npm start      # http://127.0.0.1:3000
```

### Docker

```bash
docker build -t daily-luck .
docker run --rm -p 3000:3000 -v daily-luck-data:/app/data daily-luck
```

镜像为两阶段构建：构建阶段安装全部依赖并编译前后端；运行阶段只带生产依赖与构建产物。`/app/data` 声明为卷，**必须挂载才能持久化档案**。

镜像内置健康检查：每 30 秒请求 `/health`。

### Render（演示用）

仓库根目录的 `render.yaml` 已配置一键部署。免费层的已知限制：

- 闲置 15 分钟休眠，首次访问需 30~60 秒冷启动；
- **未挂持久磁盘**，重新部署后数据重置。

因此 Render 部署**仅适合演示**，不适合长期保存真实档案。

### 发布到公网前的检查

1. 确认是否真的需要对外提供服务——默认只监听回环地址是安全基线。
2. 若改变 `HOST`，必须评估暴露面：无鉴权、无速率限制、无访问日志审计。
3. 确认 `data/` 卷已挂载并具备备份策略。
4. 确认 HTTPS 由反向代理或平台侧提供。

## 12. 回滚

| 场景 | 做法 |
|---|---|
| 新版本有问题 | `git revert` 后重新构建部署；或用镜像标签回退到上一版 |
| 前端产物异常 | 重新 `npm run build`；产物为纯静态文件，可直接回退 |
| 数据库结构变更出错 | 迁移逻辑幂等且包在事务中；必要时从备份恢复 `fortune.db` |
| 加密方案变更出错 | 恢复 `fortune.db` **与** `secret.key`（两者必须配套） |
| 密钥丢失 | **无法回滚**——已加密字段不可恢复，这是设计取舍 |

**要点**：备份必须是「数据库 + 密钥」成对备份。只备份其中之一都无法恢复档案。

## 13. 常见问题

| 问题 | 原因与处理 |
|---|---|
| `npm run dev` 后接口 404 | 前端未走代理；确认通过 <http://localhost:5173> 访问而不是直接开 HTML |
| 端口被占用 | 改 `PORT`；或关闭占用 3000 的进程 |
| `PORT must be an integer between 1 and 65535` | `PORT` 非法，检查环境变量 |
| 报告接口返回 `NO_PROFILE` | 尚未保存档案，先在表单中填写并保存 |
| 出生日期被拒绝 | 必须在 `1900-01-01` 至今天之间 |
| 出生时辰被拒绝 | 必须为 `HH:mm`（`00:00`–`23:59`） |
| 手机尾号被拒绝 | 最多 4 位数字 |
| 查询区间报错 | 单次最多 366 天，且 `start` 不能晚于 `end` |
| 档案读取失败、提示密钥问题 | `secret.key` 丢失或损坏（长度非 32 字节）；从相应数据目录的备份恢复密钥 |
| 换机器后档案是乱码/读不出 | 数据库与密钥不配套；必须成对迁移 |
| 结果每次刷新都变 | 不应发生；检查是否误引入了非确定性输入 |
| Docker 中数据丢失 | 未挂载 `/app/data` 卷 |
| Render 演示数据重置 | 免费层无持久磁盘，属预期 |
| CI 失败在 `npm audit` | 生产依赖出现高危漏洞，需升级依赖 |
| `npm run check` 的 verify 步骤失败 | 检查 Node 版本是否 ≥ 22.12，以及历法/SQLite 是否可用 |

## 14. 安全政策

### 支持范围

安全更新仅针对默认分支的最新版本。

### 报告漏洞

**请不要通过公开 Issue 披露安全漏洞。** 优先使用 GitHub 仓库 `Security` 页面中的 `Report a vulnerability` 私下报告，并提供：

- 受影响版本；
- 复现步骤；
- 潜在影响；
- 缓解建议。

维护者会尽快确认报告，并在修复发布后协调披露。

### 敏感数据提醒

本项目会在 `data/` 下保存本地个人资料和加密密钥。报告问题时请使用**虚构数据**，切勿附加真实数据库、密钥或个人信息。
