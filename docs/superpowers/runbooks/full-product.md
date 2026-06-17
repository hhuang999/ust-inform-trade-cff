# 全产品冒烟手册 (Full Product)

**分支**: 已提升为 `main`(主干)。原 `feat/paper-redesign-full-product` 直接 fast-forward 为 `main`,线性历史完整保留(`master` 脚手架 → `feat/p0-user-auth-foundation` 地基 → 纸感重构 + 全产品,无 merge 提交)。旧分支 `master`/`feat/p0-user-auth-foundation`/`feat/paper-redesign-full-product` 均已包含在 `main` 内,可按需删除。
**范围**: 纸感风前端重构 + 全部 PRD 功能(用户/认证、二手物品、咨询服务、需求、撮合/预约、评价、举报、违规、管理后台、通知、Cron)。
**设计基准**: `coze/` 参考(纸感风:暖橙棕 #C96F3D / 米黄底 #FBF3E7 / 衬线标题 / 暖棕柔影)。

---

## 1. 已实现(按 PRD 模块)

| 模块 | 后端 | 前端 |
|---|---|---|
| 用户/认证 | User/VerificationRequest/Auth.js v5(Credentials+JWT)/bcrypt | 注册/登录(字段校验+密码切换+toast)、设置(头像+学生证上传)、个人主页(Avatar+信誉两栏+历史 Tabs)、管理员认证审核 |
| 二手物品 | Item/ItemInterest(我想要)/ItemDeal(撮合)/Favorite + 9 actions + 状态机(AVAILABLE→PENDING→SOLD,确认完成/取消) | /items(筛选搜索排序分页)、/items/[id](详情+意向人+撮合+联系方式可见性)、/items/new+edit(多图+草稿)、/me/items(订单中心) |
| 服务 | Service/ServiceSlot/Booking + actions(预约占位锁死、确认/拒绝、确认完成、取消免责、7天自动完成) | /services 广场、/services/[id](详情+可预约时段+预约)、/services/new+edit、/me/bookings |
| 需求 | Need/NeedMatch(应征,唯一[need,provider]) + actions(选 TA、确认/取消/免责) | /needs 广场、/needs/[id](详情+应征)、/needs/new+edit、/me/matches |
| 评价 | Review(双盲:双方都评才公开;唯一[dealType,dealId,reviewer];30天自动公开) | ReviewDialog(COMPLETED 后,星级+计数)、主页信誉聚合(物品/服务分栏 avg+count+最近评价) |
| 举报 | Report(多态 target)+ createReport | ReportDialog(物品/服务/需求详情页,理由+补充说明) |
| 违规 | Violation + 违规计数(取消免责不同意/管理员手动) | 主页违规徽章 |
| 管理后台 | resolveReport(NONE/WARNING/TAKEDOWN/BAN) | /admin/verify(认证)、/admin/reports(举报队列+下架/封禁)、admin 导航 |
| 通知 | Notification(含 data 载荷) | /notifications(分组/筛选/全部已读/行动型链接)、铃铛下拉 |
| Cron | /api/cron/timeout:7天自动完成 + 7天免责默认(计违规) + 30天评价公开 | vercel.json 每小时触发 |

数据模型见 `prisma/schema.prisma`(迁移 `20260616200819_full_product_models` + `20260617000001_needmatch_unique`)。

---

## 2. 本地运行(无外部凭证)

```bash
# 1. 启动本地 Postgres(postgres:15)
docker run -d --name inform-trade-db \
  -e POSTGRES_USER=app -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=inform_trade \
  -p 5433:5432 postgres:15   # 已存在则 docker start inform-trade-db

# 2. 迁移 + 种子(所有命令带 DATABASE_URL 前缀;Prisma 7 运行时不读 .env.local 的空 DATABASE_URL)
export DATABASE_URL="postgresql://app:devpass@localhost:5433/inform_trade?schema=public"
pnpm install
pnpm prisma migrate deploy
pnpm db:generate
pnpm tsx scripts/seed-admin.ts      # 需先在 .env.local 设 ADMIN_EMAIL(或直接 SQL 改)
pnpm tsx scripts/seed-items.ts       # 演示卖家 demo_seller@example.com / devpass123 + 9 物品
pnpm tsx scripts/seed-services.ts    # 4 服务 + 8 时段 + 3 需求

# 3. 开发服务器
DATABASE_URL="postgresql://app:devpass@localhost:5433/inform_trade?schema=public" pnpm dev
# 浏览 http://localhost:3000 ;用 demo_seller@example.com / devpass123 登录体验已认证页
```

> **重要**:装包前确保无残留 `next dev` / `prisma migrate` 进程锁 node_modules(Windows 下会 EPERM):
> `powershell "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | ? { $_.CommandLine -match 'inform_trade_for_ust' -and $_.CommandLine -match 'next|migrate' } | % { Stop-Process -Id $_.ProcessId -Force }"`
> (勿杀 MCP / Claude 自身的 node 进程。)

---

## 3. 自动化验证(开发代理已完成)

| 检查 | 结果 |
|---|---|
| 单元测试 `pnpm test` | ✅ 6 文件 / 19 用例(password/state-machine/contact-visibility/permissions/validation/paths) |
| 类型检查 `pnpm typecheck` | ✅ 0 error |
| Lint `pnpm lint` | ✅ 0 error(14 可接受 warning:R2 图片 `<img>` ×N、carousel setState-in-effect 降级 warn、`decision` 形参) |
| 生产构建 `DATABASE_URL=… pnpm build` | ✅ 全路由编译(/ /login /register /profile/[id] /settings /items* /services* /needs* /me/items /me/bookings /me/matches /notifications /admin/verify /admin/reports + 全 API + middleware) |
| 运行时冒烟(dev + 浏览器) | ✅ 登录→首页(个性化)→/items→/me/items→/services→/needs 全链路 0 控制台错误;纸感视觉确认 |

---

## 4. 需真实凭证后才能验证(本地 Docker 测不了)

填 `.env.local`:
- `DATABASE_URL` = Neon **直连**(迁移用);生产运行时可改**池化**串
- `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_PUBLIC` / `R2_BUCKET_PRIVATE`
- `NEXT_PUBLIC_R2_PUBLIC_BASE_URL`(公开桶开启 Public Access 后的域名)
- `ADMIN_EMAIL`(首个管理员邮箱)
- (`AUTH_SECRET` / `CRON_SECRET` 已生成就绪)

填后手动冒烟:头像/学生证/物品多图真实 R2 上传与展示、私有学生证 `/api/admin/student-id` 读取、`pnpm seed:admin`、`/api/cron/timeout` 带 `Authorization: Bearer <CRON_SECRET>`。

---

## 5. 部署(Vercel)

- Vercel 项目环境变量配置上述全部(运行时 DATABASE_URL 用 Neon 池化串)。
- `pnpm build` 通过即可部署。
- `vercel.json` 已配置每小时触发 `/api/cron/timeout`。
- Neon 生产建议:运行时池化、迁移直连(如需拆分,后续给 `prisma.config.ts` 加 `DIRECT_URL`)。

---

## 6. 已知取舍 / 后续

- **卖家评分**:列表/详情页暂未展示实时评分(避免 N+1);主页信誉已聚合。后续可按需加 denormalized rating 字段。
- **周模板可预约时间**:MVP 仅"手动添加具体时段"(PRD MVP 范围);周模板自动生成留作增强。
- **站内信/IM**:按 PRD 不做(平台不介入交易沟通,仅站内通知)。
- **暗色模式**:已改为暖棕墨色(非冷蓝);未加切换控件(P5 打磨可加 next-themes)。
- **NeedMatch 唯一性**:`@@unique([needId,providerId])` 已在 DB 层兜底。
- **评价/举报/违规/Cron 逻辑**:经类型检查 + 构建 + 代码审查通过,但完整真实数据流(如 7 天/30 天触发、双盲公开)需上线后随真实数据观察。
