# P0 冒烟测试手册 (Smoke Test Runbook)

**范围**:P0「用户系统 + 身份认证 + 个人主页(地基)」。
**分支**:`feat/p0-user-auth-foundation`。
**关联**:[spec](../specs/2026-06-16-p0-user-auth-foundation-design.md)、[plan](../plans/2026-06-16-p0-user-auth-foundation.md)。

---

## 1. 自动化验证(开发代理已完成)

下列检查在本地 Docker Postgres 下**全部通过**,无需任何外部凭证:

| 检查 | 命令 | 结果 |
|---|---|---|
| 单元测试(纯逻辑) | `pnpm test` | ✅ 6 文件 / 19 用例全过(password / state-machine / contact-visibility / permissions / validation / paths) |
| 类型检查 | `pnpm typecheck` | ✅ 无错误 |
| Lint | `pnpm lint` | ✅ 0 错误(3 个可接受警告,见 §1 末) |
| 生产构建 | `DATABASE_URL=… pnpm build` | ✅ 所有路由编译成功(`/login` `/register` `/settings` `/profile/[id]` `/admin/verify` + 全部 API + middleware) |
| 运行时数据层冒烟 | (临时脚本,已删) | ✅ 建用户 → authorize 查找+验密 → 建认证申请 → 管理员通过(改状态/角色)→ 建通知+列表 → 级联清理,断言全过 |
| 端到端浏览器冒烟 | `pnpm dev` + 浏览器 | ✅ 注册→自动登录→主页渲染→登出→中间件拦截→登录,全链路通过(详见 §3) |

**已知可接受 lint 警告**:
- 2 处 `<img>`(profile 头像 / admin 学生证缩略图):头像来自 R2 公开域名、学生证来自私有流式接口,均不宜改用 `next/image`(需先配 R2 域名 remotePatterns);MVP 保留 `<img>`。
- `src/lib/verification/state-machine.ts` 中 `isValidReview(reqStatus, decision)` 的 `decision` 当前未参与判断(仅 `PENDING` 可审核),属有意保留的 API 形参。

---

## 2. 本地复现(无外部凭证)

本地用 Docker Postgres 替代 Neon;所有 DB 命令用 `DATABASE_URL` 前缀(**不改动 `.env.local`**):

```bash
# 启动本地 Postgres(仅需拉取一次 postgres:15)
docker run -d --name inform-trade-db \
  -e POSTGRES_USER=app -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=inform_trade \
  -p 5433:5432 postgres:15

# 应用迁移
DATABASE_URL="postgresql://app:devpass@localhost:5433/inform_trade?schema=public" pnpm db:migrate

# 开发服务器(注意前缀;.env.local 的 AUTH_SECRET / CRON_SECRET 已就绪)
DATABASE_URL="postgresql://app:devpass@localhost:5433/inform_trade?schema=public" pnpm dev
```

> `src/lib/db.ts`(Prisma 7 + `@prisma/adapter-pg`)在模块加载时若 `DATABASE_URL` 为空会抛错,故本地 / 构建都必须带前缀。
> 生产环境把真实 Neon `DATABASE_URL` 写进 `.env.local` 即可,无需前缀。

---

## 3. 已完成的端到端冒烟(参考)

本地 dev + 浏览器实测通过:

1. `/register` 填写并提交 → 自动登录并跳转 `/profile/<id>`,认证状态「未认证」;导航栏出现「我的主页 / 设置 / 通知 / 登出」(非管理员无「审核」入口)。
2. 个人主页正确展示:昵称、院系、入学年份、真实姓名(勾选公开时)、违规次数 0、信誉/历史占位。
3. 点「登出」→ 跳转 `/`。
4. 未登录访问 `/settings` → 跳 `/login?callbackUrl=%2Fsettings`(中间件生效,回调地址保留)。
5. `/login` 用注册邮箱+密码登录 → 跳转 `/`。

---

## 4. 需配置外部凭证后才能验证的部分

填写 `.env.local` 空缺值后完成(本地 Docker 环境无法测,因缺真实 Neon/R2/管理员邮箱):

**前置 —— 填 `.env.local`**:
- `DATABASE_URL`(Neon,迁移用**直连/非池化**串)
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_PUBLIC` / `R2_BUCKET_PRIVATE`(默认名已填,按实际桶名调整)
- `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`(公开桶开启 Public Access 后的域名)
- `ADMIN_EMAIL`(你将设为首个管理员的邮箱)

**手动冒烟步骤**:
1. `pnpm db:migrate`(把迁移应用到 Neon)。
2. `/register` 用 `ADMIN_EMAIL` 注册一个账号 → 登录。
3. `pnpm seed:admin`(读取 `ADMIN_EMAIL`)→ 该账号变为 `ADMIN` + `VERIFIED`。
4. 重新以管理员登录 → `/settings` 上传一张学生证图:
   - 正常图(<5MB, `image/*`)→ 预签名直传成功 → 提交 → 状态「审核中」,出现站内通知。
   - 超大图(>5MB)→ 被 R2 拒绝(预签名 `content-length-range` 条件)。
5. `/admin/verify` 看到该申请 + 学生证图(私有接口 `/api/admin/student-id?key=…` 仅管理员可读)→ 点「通过」→ 原用户状态「已认证」并收到通知。
6. 重复走「拒绝 + 理由」→ 状态「认证未通过」,用户可重新提交。
7. 头像上传:`/api/upload-url`(purpose=`avatar`)→ 直传到公开桶 → 个人主页展示头像(经 `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`)。
8. 私有 URL 直接访问 `/api/admin/student-id?key=…`:未登录 / 非管理员 → `403`;key 非法前缀(非 `private/student-ids/`)→ `400`。
9. `/api/cron/timeout` 带 `Authorization: Bearer <CRON_SECRET>` → `{ok:true,scanned:0}`;不带 → `401`。

---

## 5. 部署(Vercel)

- 在 Vercel 项目设置中配置上述全部环境变量。
- `vercel.json` 已配置每小时触发 `/api/cron/timeout`(P0 为占位,超时逻辑在 P1/P2 实现)。
- `pnpm build` 通过即可部署。
- Neon 生产建议:运行时用**池化**连接串,DB 迁移用**直连**串(P0 暂用单一 `DATABASE_URL`;如需拆分,后续加 `DIRECT_URL` 给 `prisma.config.ts`)。
