# ARCHITECTURE.md — 系统设计说明

> 本文回答：这些需求**是怎么被实现的**。
> 业务规则见 `REQUIREMENTS.md`；开发、测试与部署见 `DEVELOPMENT.md`。

## 1. 总体架构

```text
┌──────────────────────────────────────────────┐
│        浏览器（Vue 3 + TypeScript）             │
│  档案表单 · 命盘面板 · 报告面板 · 趋势图 · 运势签  │
└──────────────────┬───────────────────────────┘
                   │ 同源 /api/*（开发时 Vite 代理）
┌──────────────────▼───────────────────────────┐
│            Fastify（Node.js）                  │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 路由与校验   │  │ 运势算法  │  │ 静态托管  │  │
│  │ app.ts     │  │ fortune  │  │ frontend │  │
│  │ validate.ts│  │ .ts      │  │ /dist    │  │
│  └─────┬──────┘  └────┬─────┘  └──────────┘  │
│        │              │                       │
│  ┌─────▼──────────────▼───────────────────┐  │
│  │  crypto.ts（AES-256-GCM）               │  │
│  │  db.ts（node:sqlite）                   │  │
│  └────────────────┬───────────────────────┘  │
└───────────────────┼──────────────────────────┘
                    ▼
        data/fortune.db（源码运行时 SQLite）
        data/secret.key（源码运行时密钥）
                    ▲
                    │ 历法计算
        lunar-typescript（进程内，无网络）
```

### 关键架构特征

1. **无网络依赖**：历法计算在进程内完成，不调用任何外部 API。
2. **单机单用户**：无账号、无会话、无多租户隔离。
3. **默认只监听 `127.0.0.1`**：不是「配了才安全」，而是默认即不对外。
4. **前端与 API 同源**：开发时 Vite 代理，生产时 Fastify 同端口托管静态资源，因此不需要 CORS。
5. **确定性算法**：运势计算的输入只有「档案 + 日期」，不含时间或随机源。

## 2. 前端架构

### 页面组织

单页应用，一个 `App.vue` 负责组合与状态，不引入路由库。

| 文件 | 职责 |
|---|---|
| `frontend/src/main.ts` | 挂载入口 |
| `frontend/src/App.vue` | 页面组合、档案/命盘/报告状态与数据加载 |
| `frontend/src/style.css` | 全局样式与 Tailwind 引入 |
| `frontend/src/lib/api.ts` | API 客户端（相对路径同源请求） |
| `frontend/src/lib/types.ts` | 与后端共享的 `Profile` / `Chart` / `Report` 类型定义 |

### 组件设计

| 组件 | 职责 |
|---|---|
| `components/ProfileForm.vue` | 档案录入与保存 |
| `components/ChartPanel.vue` | 命盘展示（八字四柱、星座、生肖、生命数字、五行） |
| `components/ReportPanel.vue` | 五项指数、综合分与解读 |
| `components/TrendChart.vue` | 7 日运势趋势曲线 |
| `components/ScoreGauge.vue` | 单项分数可视化 |
| `components/FortuneSlip.vue` | 运势签样式呈现 |
| `components/FortuneCat.vue` | 装饰性吉祥物 |
| `components/CloudDivider.vue` | 版式分隔 |

### 状态管理

不使用 Pinia / Vuex。`App.vue` 用组合式 API 管理：

- `ref` 持有档案、命盘与报告数据；
- `computed` 派生展示值；
- `watchEffect` 在档案变化时重新拉取报告；
- `onMounted` 首次加载档案。

### API 请求层

`lib/api.ts` 提供 `fetchProfile` / `saveProfile` / `fetchReports`，统一处理：

- 相对路径请求（`API_BASE = ''`），保证同源、无 CORS；
- 非 2xx 响应解析后端 `{ error, message }` 并抛出可展示的中文错误。

### 错误处理方式

请求失败统一抛出 `Error`，由 `App.vue` 捕获并展示。后端错误体格式固定为 `{ error, message }`，前端优先展示 `message`。

## 3. 后端架构

| 文件 | 职责 |
|---|---|
| `server/src/index.ts` | 进程入口：读取 `HOST` / `PORT`，校验端口合法性，注册 `SIGINT` / `SIGTERM` 优雅关闭 |
| `server/src/app.ts` | 应用工厂 `buildApp()`：打开数据库、装配加密器与两个存储、注册路由、可选托管前端静态资源 |
| `server/src/db.ts` | 建表与迁移；`openProfileStore`（加密读写档案）、`openReportCache`（报告缓存） |
| `server/src/fortune.ts` | 排盘与运势算法（`buildChart` / `buildReport`） |
| `server/src/fortune-tables.ts` | 规则常量查找表（五行生克、三合六合、生肖边界、幸运数字颜色等） |
| `server/src/crypto.ts` | AES-256-GCM 文本加解密；密钥加载或首次生成 |
| `server/src/validate.ts` | 输入校验守卫（与路由、数据库逻辑分离） |
| `server/src/verify.ts` | 运行环境自检（历法、SQLite、Fastify） |
| `server/src/paths.ts` | 路径常量单一来源（数据目录、数据库、密钥、前端产物） |

### 分层

```text
路由层（app.ts）
    ↓ 调用校验守卫
校验层（validate.ts）
    ↓
领域层（fortune.ts + fortune-tables.ts）
    ↓
存储层（db.ts → crypto.ts + node:sqlite）
```

### 设计要点

- `buildApp(options)` 支持注入 `databaseFile`、`encryptionKey`、`logger`、`serveFrontend`，使测试可以完全隔离运行。
- 应用关闭时通过 `onClose` 钩子关闭数据库。
- `paths.ts` 以模块所在目录反推项目资源根目录，因此开发（`server/src`）与构建后（`server/dist`）都能正确定位 `frontend/dist`。源码运行数据写入项目根目录 `data/`；Windows EXE 版写入 `%LOCALAPPDATA%\DailyLuck\data`，避免尝试修改只读的可执行文件快照。

## 4. 模块划分

| 模块 | 依赖 |
|---|---|
| 档案 | `db.openProfileStore` → `crypto` |
| 命盘 | `fortune.buildChart` → `lunar-typescript` + `fortune-tables` |
| 报告 | `fortune.buildReport` → `fortune.buildChart` + `fortune-tables` |
| 缓存 | `db.openReportCache` → `node:sqlite` |
| 校验 | `validate`（无依赖，纯函数） |
| 加密 | `crypto` → `node:crypto` + `paths` |
| 前端展示 | `lib/api` → `App.vue` → `components/*` |

依赖方向单向：`app.ts` → 领域/存储 → `paths` / `crypto`。`validate.ts` 与 `fortune-tables.ts` 为叶子模块。

## 5. 数据模型

SQLite。源码运行时位于项目根目录 `data/fortune.db`；Windows EXE 版位于 `%LOCALAPPDATA%\DailyLuck\data\fortune.db`。

### profile（单行表）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 固定为 `1`（`CHECK (id = 1)`），保证单行 |
| `name_enc` | TEXT NOT NULL | **姓名密文**（AES-256-GCM，base64） |
| `iv_name` | TEXT NOT NULL | 姓名的 IV（base64） |
| `birth_date` | TEXT NOT NULL | 出生日期 `YYYY-MM-DD` |
| `birth_time` | TEXT NOT NULL DEFAULT `''` | 出生时辰 `HH:mm` |
| `gender` | TEXT NOT NULL DEFAULT `'unknown'` | `male` / `female` / `unknown` |
| `blood_type` | TEXT NOT NULL DEFAULT `''` | `A` / `B` / `AB` / `O` / 空 |
| `phone_tail_enc` | TEXT NOT NULL DEFAULT `''` | **手机尾号密文** |
| `iv_phone` | TEXT NOT NULL DEFAULT `''` | 手机尾号的 IV |
| `updated_at` | TEXT NOT NULL | 默认 `datetime('now')` |

**加密策略**：姓名与手机尾号加密；出生日期、时辰、性别、血型以明文存储——它们是计算必需的输入，且本身不构成直接身份标识。

### daily_reports（报告缓存）

| 字段 | 类型 | 说明 |
|---|---|---|
| `date` | TEXT NOT NULL | `YYYY-MM-DD` |
| `jitter` | INTEGER NOT NULL | 波动开关（确定性，非随机） |
| `payload` | TEXT NOT NULL | 序列化后的报告 |
| `created_at` | TEXT NOT NULL | 默认 `datetime('now')` |
| 主键 | | `(date, jitter)` |

**迁移**：启动时检查主键是否为 `(date, jitter)`；若为旧结构则重命名旧表、建新表并搬迁数据，整个过程包在事务中。

### 数据生命周期

- 档案：单行，随用户修改覆盖更新。
- 报告缓存：按日累积，无自动清理；重复访问命中缓存。
- 密钥：首次运行生成并写入数据库所在目录的 `secret.key`（源码运行时权限 `0600`）。

## 6. API 与服务关系

无第三方 API 文档工具，接口数量少，直接在本节维护。

| 方法 | 路径 | 说明 | 成功响应 |
|---|---|---|---|
| `GET` | `/health` | 服务健康检查 | `{ ok, service }` |
| `GET` | `/api/today` | 历法引擎探测（返回今日干支与农历） | 日期、农历、八字四柱、可用提示 |
| `GET` | `/api/profile` | 读取档案与命盘 | `{ profile, chart }`（无档案时为 `null`） |
| `PUT` | `/api/profile` | 校验并保存档案 | `{ profile, chart }` |
| `GET` | `/api/reports` | 获取日期区间报告 | `{ reports: Report[] }` |

### `/api/reports` 参数

| 参数 | 默认 | 约束 |
|---|---|---|
| `start` | 今天 | 真实 `YYYY-MM-DD` |
| `end` | 等于 `start` | 真实 `YYYY-MM-DD`，不早于 `start`，与 `start` 跨度 ≤ 366 天 |
| `jitter` | 开启 | `0` 或 `false` 关闭波动 |

### 错误约定

| 状态码 | 场景 |
|---|---|
| 400 | 参数非法（日期越界、时辰格式错、手机尾号非法、区间超限） |
| 404 | `NO_PROFILE`：尚未保存个人档案 |

错误体统一为 `{ error, message }`，`message` 为中文可读信息。

### 请求链路（查询报告）

```text
浏览器 GET /api/reports?start=…&end=…&jitter=1
    ↓
app.ts 解析 query → validate 校验日期与跨度
    ↓
profileStore.load()（解密姓名与手机尾号）
    ↓
无档案 → 404 NO_PROFILE
    ↓
逐日：reportCache.get(date, jitter)
    ├─ 命中 → 直接返回缓存
    └─ 未命中 → buildReport(date, profile, jitter) → reportCache.put()
    ↓
返回 { reports }
```

## 7. 核心数据流

### 确定性运势计算

```text
输入：profile（姓名/出生日期/出生时辰/性别/血型/手机尾号）+ dateKey
    ↓
hashString(档案 + 日期)  →  种子
    ↓
mulberry32(种子)  →  确定性伪随机序列
    ↓
基础分（五项分类）
    ↓
叠加规则：
    ├─ lunar-typescript：干支、生肖、宜忌、冲煞、方位
    ├─ 出生日期/时辰 → 四柱、星座、生命数字、五行关系
    └─ 血型/手机尾号/姓名长度 → 小幅加成
    ↓
限制到固定区间 → 五项分类分
    ↓
综合分 = 五项平均
    ↓
Report（含幸运色/数字/方位、贵人属相、冲煞生肖）
```

**关键点**：全流程无时间输入、无真随机。同一个 `(profile, dateKey)` 永远得到同一个 `Report`。

### 档案保存

```text
前端 PUT /api/profile
    ↓
validate 校验（日期范围 / 时辰格式 / 手机尾号 / 姓名长度 / 性别 / 血型）
    ↓
crypto.encrypt(姓名)、crypto.encrypt(手机尾号)  → 密文 + IV
    ↓
profileStore.save()（单行覆盖写入）
    ↓
buildChart(profile) 返回命盘
```

## 8. 第三方服务

**本项目不接入任何第三方网络服务。**

| 依赖 | 用途 | 性质 |
|---|---|---|
| `lunar-typescript` | 农历、八字、生肖、宜忌、冲煞、方位 | 进程内计算库，无网络 |
| `@fastify/static` | 生产模式托管前端产物 | 本地静态文件 |
| `fastify` | HTTP 服务 | 本地 |
| `vue` / `vite` / `tailwindcss` / `@lucide/vue` | 前端框架、构建与样式 | 构建期与运行期前端资源 |

部署侧可选：**Render 免费层**（演示用，`render.yaml` 已配置）与 **Docker**（`Dockerfile` 两阶段构建）。

## 9. 权限与安全设计

### 身份认证

**无。** 单机单用户，不存在登录与会话。

### 权限模型

**无分级。** 所有 API 对本地访问者开放。安全性由「默认只监听回环地址」而非鉴权保证。

### 数据访问范围

- 数据仅存本机；源码运行时存入项目根目录 `data/`，Windows EXE 版存入 `%LOCALAPPDATA%\DailyLuck\data`。
- 服务默认只监听 `127.0.0.1`。
- 不开放跨域（CORS），因此浏览器中其他站点无法读取本服务响应。
- 无遥测、无上报、无第三方分析。

### 敏感信息处理

| 措施 | 说明 |
|---|---|
| 字段级加密 | 姓名、手机尾号用 AES-256-GCM 加密后落盘 |
| IV 随机化 | 每次加密生成 12 字节随机 IV，与密文分开存储 |
| 完整性校验 | 使用 GCM 认证标签，篡改可被检测 |
| 密钥文件权限 | 源码运行时的 `data/secret.key` 以 `0600` 写入；Windows EXE 版写入当前用户本地数据目录 |
| 密钥长度校验 | 读取时校验必须为 32 字节，否则启动报错 |
| 仓库卫生 | `data/`、`.env*`、构建产物均在 `.gitignore` 中 |

### 已知取舍

- 密钥与数据库同机存放：本地场景下无法防御已获得文件系统访问权的攻击者。这是「无账号、纯本地」定位下的必然取舍。
- 出生日期与时辰明文存储：它们是计算输入，加密会显著增加复杂度而收益有限。
- 密钥丢失即数据不可恢复：不提供恢复通道，因为提供恢复通道等于引入后门。

## 10. 关键技术决策

### 为什么要求结果必须确定

如果结果每次刷新都变，用户会立刻判断「这是随机的」，产品信任瞬间归零。确定性带来三个好处：结果自洽、行为可测试、用户可复现。实现上只允许「档案 + 日期」作为输入，随机性来自确定性伪随机（mulberry32）而非系统随机源。

### 为什么用哈希 + 确定性伪随机，而不是直接用日期算

纯日期函数会让所有人的同一天高度雷同。以「档案 + 日期」的哈希作种子，既保证同人同日稳定，又让不同档案的曲线彼此区分。

### 为什么用 `node:sqlite` 而不是第三方数据库驱动

Node 22.12+ 内置 `node:sqlite`，无需原生编译、无额外依赖、无安装步骤。项目定位是本地单机应用，不需要连接池、迁移框架或 ORM。代价是要求较高的 Node 版本，已在 `engines` 中显式约束。

### 为什么把历法计算放在进程内

调用外部 API 会带来网络依赖、隐私风险与稳定性问题，而历法是完全可离线计算的确定性数据。`lunar-typescript` 提供真实干支历、宜忌与冲煞，避免了自造规则导致的错误。

### 为什么前端与 API 同源

同源意味着不需要 CORS 配置，也不需要在浏览器中暴露 API 地址。开发时用 Vite 代理，生产时由 Fastify 同端口托管 `frontend/dist`，两种模式行为一致。

### 为什么加密只覆盖姓名与手机尾号

这两个字段是档案中**最直接指向个人**的信息，且不参与运势计算。出生日期与时辰是计算输入，性别与血型是弱标识，加密它们的复杂度收益比不划算。这是一个显式的、可解释的取舍。

### 为什么默认只监听 `127.0.0.1`

「默认安全」优于「配了才安全」。用户如果确实需要对外提供服务，必须显式修改 `HOST`，这个动作本身就是一次有意识的风险确认。

### 为什么不做账号与云同步

引入账号就要引入服务器、数据库运维、密码管理、数据合规与泄露责任——这与「数据不出本机」的核心定位直接冲突。用「导出/备份数据文件」替代云同步。

### 为什么算法与规则常量分离

`fortune.ts` 是流程，`fortune-tables.ts` 是数据（五行生克、三合六合、生肖边界、幸运色数字等）。分离后，调规则不需要改流程代码，审阅规则也不需要读懂算法，测试也能分别覆盖。
