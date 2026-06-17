# 校园枢纽 · HKUST(GZ)

校园信息服务与二手交易平台 —— 物品交易、技能服务、需求撮合、双向评价、举报与身份认证审核。
基于 **Next.js 16 (App Router) + Prisma + PostgreSQL (Neon) + Auth.js v5 + Cloudflare R2**。

## 本地开发

```bash
pnpm install
cp .env.example .env.local   # 填入 DATABASE_URL / R2_* / AUTH_SECRET / ADMIN_EMAIL 等
pnpm db:generate
pnpm dev
```

验证三件套：`pnpm typecheck` · `pnpm test` · `pnpm build`。

## 技术栈

- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- Prisma 7（`@prisma/adapter-pg`）· PostgreSQL (Neon)
- Auth.js v5（Credentials + JWT，bcryptjs）
- Cloudflare R2（`@aws-sdk/client-s3` 预签名 PUT 直传）
- Tailwind CSS 4 / shadcn 风格组件

## 沙箱部署（boxset 分支）

`boxset` 分支针对校园部署沙箱做了适配。沙箱内可直接：

```bash
git clone -b boxset https://github.com/hhuang999/ust-inform-trade-cff.git
cd ust-inform-trade-cff
```

### 平台规则

1. 反代把 `/apps/<应用名>/*` 转发到 `0.0.0.0:3000`；**应用名由平台分配、不固定**。
2. 应用须监听 `0.0.0.0:3000`。
3. `/mydata/` 是唯一持久化路径，沙箱重建后仅此目录保留。

### 配置（一次，持久化）

把环境变量写入 `/mydata/.env`（模板见仓库 `.env.example`），其中关键一项：

```
BASE_PATH=/apps/<你的应用名>
```

数据库（Neon）与图片（Cloudflare R2）均为远端服务，本地不落地任何文件，因此除 `.env` 外无需额外持久化。

### 启动

```bash
bash scripts/sandbox-start.sh
```

脚本依次：`source /mydata/.env` → `pnpm install` → `pnpm build` → `next start -H 0.0.0.0 -p 3000`。
启动日志应出现 `Ready on http://0.0.0.0:3000`。

### 工作原理：动态前缀

- `next.config.ts` 读取 `BASE_PATH` 设为 Next.js 原生 `basePath`。
- **入站**：请求带 `/apps/<名>/` 前缀，Next 自动剥离 basePath 后再路由（**无需自写 middleware**）。
- **出站**：`<Link>` / `useRouter` / server action / `/_next` 静态资源自动带前缀。
- 少数**绕过 Next 路由的原生请求**（客户端 `fetch("/api/upload-url")`、`fetch("/api/notifications")`、原生 `<form action="/items" method="get">` 过滤表单、管理端学生证 `<img src="/api/admin/student-id">`）经 `withBasePath()`（`src/lib/base-path.ts`）手动拼前缀。
- **换应用名**：只改 `/mydata/.env` 的 `BASE_PATH=/apps/<新名>` 重新部署即可，**无需改代码**。

> 说明：没有采用「middleware 剥前缀 + `<base href>`」方案 —— `<base>` 只对**相对**路径生效，而 Next 生成的是**根相对**链接（`/foo`），`<base>` 不会为其拼前缀，会导致资源/链接 404。原生 `basePath` 才是 Next.js 下子路径部署的正解。

### 备注

- 若平台用 cron 调度本服务 `/api/cron/timeout`，外部调用 URL 也要带前缀：`/apps/<名>/api/cron/timeout`（仍用 `CRON_SECRET` 鉴权）。
- `BASE_PATH` 留空时（如本地或常规部署），`basePath` 为空，行为与 `main` 完全一致。
