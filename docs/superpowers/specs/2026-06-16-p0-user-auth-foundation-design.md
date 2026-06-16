# P0 设计:用户系统 + 身份认证 + 个人主页(地基)

**文档版本**:v1.0
**日期**:2026-06-16
**状态**:已与用户确认,待 spec 复核
**关联**:[PRD.md](../../../PRD.md)

---

## 0. 背景与定位

本仓库是全新项目(greenfield),仅有 PRD.md,无代码、无提交。PRD 是一份完整的产品规格;本系列设计文档补齐**技术决策**层。

因 MVP 规模大(约 8 个子系统),整体拆分为 4 个子项目,**每个独立走「设计 → 计划 → 实现」**:

| 子项目 | 范围 | 说明 |
|---|---|---|
| **P0 地基 + 用户系统** | 脚手架、注册登录会话、学生证认证、个人主页、联系方式可见性底层、权限中间件、通知骨架、图片存储基础设施 | 所有面板依赖,先打底 |
| P1 物品交易面板 | 发布(前端暂存)、列表/搜索筛选、"我想要"+意向人+Waiting List、状态流转、确认完成(7天超时) | 最直观、最独立 |
| P2 服务交易面板 | 服务帖+广场、需求帖+广场、Booking、Match、确认完成+取消/违规(7天超时) | 复杂度最高 |
| P3 评价/违规/举报/管理后台 | 评价(双盲公开)、违规展示、举报全流程、管理后台、通知补全场景 | 横切能力收口 |

> 评价的**触发点**会在 P1/P2 的 Completed 状态预埋,评价系统本体在 P3 实现。

**本文档范围 = P0。**

---

## 1. 关键决策(已确认)

| 决策点 | 结论 | 理由 |
|---|---|---|
| 技术栈 | Next.js 15 (App Router) + React 19 + TypeScript + Prisma + PostgreSQL | 前后端统一语言,开发最快 |
| 部署 | Vercel + Neon 托管 Postgres + Cloudflare R2 + Vercel Cron | 零运维,免费额度覆盖 MVP |
| 认证 | Auth.js (NextAuth v5),Credentials Provider + JWT 会话 | 开箱会话管理 + middleware 集成 |
| 密码 | `bcryptjs`(纯 JS),产出标准 `$2b$` bcrypt 哈希 | Vercel serverless 免原生编译坑;满足 PRD「bcrypt 加密」 |
| 认证复杂度 | **仅** 邮箱或手机号 + 密码;**不**做验证码 / OAuth / 2FA | MVP 不复杂 |
| UI 风格 | 实现阶段调用 `frontend-design` skill 做视觉设计 | 用户要求美观 |
| 登录标识 | 支持邮箱或手机号(二选一,至少一项) | 按 PRD |
| 管理员来源 | `User.role = ADMIN`,首个管理员由 seed 脚本读 `ADMIN_EMAIL` 设置,无自助提权 | 安全 |
| 界面语言 | 中文 | 校园场景 |

---

## 2. 技术栈与项目骨架

| 层 | 选型 | 备注 |
|---|---|---|
| 框架 | Next.js 15 (App Router) + React 19 + TS | 全栈单仓 |
| ORM | Prisma + PostgreSQL (Neon) | `prisma migrate dev` 管迁移 |
| 认证 | Auth.js v5 (Credentials + JWT) | |
| 密码 | bcryptjs | |
| 存储 | Cloudflare R2(`@aws-sdk/client-s3`) | 预签名直传 |
| 校验 | Zod | 所有输入边界 |
| UI | Tailwind + shadcn/ui | 快速搭页面 |
| 定时 | Vercel Cron(P0 仅配置,消费在 P1/P2) | 7 天超时 |

### 目录骨架(App Router 约定)

```
src/
  app/
    (public)/              # 浏览(免登录可看)
    (auth)/login, register # 登录注册
    (app)/                 # 已登录区
      profile/[id]
      settings
      items/...            # P1 占位
      services/...         # P2 占位
    (admin)/verify         # 管理员:认证审核(P0)
    api/
      auth/[...nextauth]
      upload-url           # 预签名 R2 URL
      notifications
  lib/
    db/        # Prisma client 单例
    auth/      # Auth.js 配置
    storage/   # R2 client + 预签名
    notifications/  # createNotification helper
    permissions/    # requireVerifiedUser / resolveContactInfo
    validation/     # Zod schemas
  components/        # 复用组件
  prisma/schema.prisma
```

---

## 3. 数据模型(Prisma,P0 仅三张表)

```prisma
enum VerificationStatus { UNVERIFIED PENDING VERIFIED REJECTED }
enum Role               { USER ADMIN }

model User {
  id                  String             @id @default(cuid())
  email               String?            @unique          // 邮箱/手机二选一(至少一项,应用层校验)
  phone               String?            @unique
  passwordHash        String
  realName            String                              // 认证核对用
  studentId           String
  department          String
  enrollmentYear      Int
  nickname            String                              // 前台展示
  avatarKey           String?                             // R2 key(public 区)
  realNameVisible     Boolean            @default(false)
  verificationStatus  VerificationStatus @default(UNVERIFIED)
  violationCount      Int                @default(0)      // P3 写入,P0 展示占位
  role                Role               @default(USER)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  deletedAt           DateTime?                           // 软删除

  verificationRequests VerificationRequest[]
  notifications        Notification[]
}

enum VerificationReqStatus { PENDING APPROVED REJECTED }

model VerificationRequest {
  id          String              @id @default(cuid())
  userId      String
  photoKeys   String[]                              // 学生证照片(private 区,可多张)
  status      VerificationReqStatus @default(PENDING)
  reviewerId  String?                               // 审核管理员
  reason      String?                               // 拒绝理由
  submittedAt DateTime            @default(now())
  reviewedAt  DateTime?
  user        User                @relation(fields: [userId], references: [id])
  @@index([status, submittedAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String                                    // 字符串而非枚举,便于增量加场景
  title     String
  body      String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  @@index([userId, read, createdAt])
}
```

**约束**:
- `User`:email / phone 至少一项非空(应用层 Zod 校验,非 DB 约束)。
- `VerificationRequest`:同一用户同时**仅允许一个 PENDING**(应用层保证;提交时若有 PENDING 则拒绝)。
- P0 **不建模** Item / Booking / Match / Review / Report,留给后续子项目,避免空壳表。

---

## 4. 认证与会话

- **Provider**:Auth.js v5 Credentials。登录字段 = 邮箱或手机号 + 密码;后端 `bcrypt.compare` 校验。
- **会话策略**:JWT(stateless,serverless 友好)。
- **注册**:Server Action → Zod 校验(必填项 + email/phone 唯一性 + 至少一项)→ `bcryptjs` 哈希 → 建用户(`verificationStatus = UNVERIFIED`)→ 自动登录。
- **MVP 不做**:邮箱/短信验证码、OAuth、2FA、密码找回(找回可作 P0 后小迭代,不阻塞主线)。
- **登出**:Auth.js 标准登出。

---

## 5. 图片存储(R2):私密 / 公开两区

| 区 | 路径前缀 | 内容 | 访问控制 |
|---|---|---|---|
| `public/` | `public/avatars`,后续 `public/items` | 头像、(P1)物品照片 | R2 公开域名 / CDN,任何人可读 |
| `private/` | `private/student-ids` | 学生证照片 | **永不公开**,仅 `role===ADMIN` 的 Route Handler 鉴权后流式读取 |

**上传链路(预签名直传)**:
1. 客户端 `POST /api/upload-url`(登录态,带 `purpose`)。
2. 服务端按 purpose 签发预签名 PUT URL,**同时锁定 MIME + 大小上限**。
3. 客户端直传 R2,成功后只把 object key 回传并保存(头像存 `User.avatarKey`;学生证存 `VerificationRequest.photoKeys`)。
4. 学生证读取:管理员页 → 受保护 Route Handler → 校验 `role===ADMIN` → 从 R2 取私密对象流式返回。

> 选 R2 而非 Vercel Blob:免费额度大、S3 兼容、无供应商出口费。

---

## 6. 学生证认证流程(状态机)

```
UNVERIFIED --(用户在 /settings 提交照片)--> PENDING
PENDING    --(管理员通过)------------------> VERIFIED
PENDING    --(管理员拒绝+理由)------------> REJECTED
REJECTED   --(用户重新提交)---------------> PENDING
```

- 用户在 `/settings` 上传学生证照片 → 建 `VerificationRequest(PENDING)`(若已有 PENDING 则提示等待)。
- 管理员在 `(admin)/verify` 看队列 → 比对照片上的**姓名 / 学号 / 院系**与 User 字段 → 通过 / 拒绝(填理由)。
- 结果:`User.verificationStatus` 更新 + 发站内通知。
- **管理员来源**:`User.role = ADMIN`;首个管理员由 `scripts/seed-admin.ts`(或 Prisma seed)读 `ADMIN_EMAIL` 环境变量创建。无任何自助提权路径。

---

## 7. 权限校验(贯穿全项目,P0 打地基)

- **路由保护**(`middleware.ts`):`(app)` 区需登录,`(admin)` 区额外需 `role===ADMIN`;未登录跳 `/login`。
- **认证态写操作门禁**:`requireVerifiedUser()` helper——P1/P2/P3 的「发布 / 我想要 / Booking / Match / 评价」等写操作统一调用,非 `VERIFIED` 直接拒绝。**P0 实现 helper 并在认证相关写操作中接入。**
- **联系方式可见性**:`resolveContactInfo(record, currentUser)`——按该条记录的可见性策略(仅认证可见 / 所有人可见)+ 当前用户认证态决定是否返回联系方式。**P0 实现机制,后续每类帖子接入。**
- **浏览**:对所有用户开放(含未认证),前台统一展示「已认证 / 未认证」标识。

---

## 8. 个人主页(`/profile/[id]`)

| 信息 | 来源 | P0 状态 |
|---|---|---|
| 头像、昵称、院系、入学年份、认证标识、违规次数 | User(强制公开) | ✅ 实现 |
| 真实姓名 | `realNameVisible` 为真才显示 | ✅ 实现 |
| 物品交易信誉(均分/笔数/文字评价) | 由 Review 聚合 | ⏳ 占位(0/空),P3 填充 |
| 服务交易信誉(均分/次数/文字评价) | 由 Review 聚合 | ⏳ 占位,P3 填充 |
| 历史记录(物品/服务/需求帖) | Item/Booking/Match | ⏳ 占位(空),P1/P2 填充 |

---

## 9. 通知骨架

- **数据**:`Notification` 表(P0 建表)。
- **helper**:`createNotification(userId, type, { title, body, link })`。
- **API**:`GET /api/notifications`(列表)、`PATCH /api/notifications/:id/read` 与 mark-all。
- **UI**:导航栏铃铛 + 未读红点 + 通知列表页。
- `type` 用字符串(非枚举),具体场景(新意向人、被选中、请确认完成…)在 P1/P2/P3 增量调用 helper 接入。

---

## 10. UI 与视觉设计

- 页面:登录、注册、个人主页、设置(含学生证上传)、管理员认证审核页。
- **视觉风格不在此预先固化**;实现阶段调用 `frontend-design` skill 产出布局 / 配色 / 组件 / 交互细节。
- 组件库基座:Tailwind + shadcn/ui。

---

## 11. 测试 / 错误处理 / 非功能

**测试(Vitest)**——P0 优先覆盖**纯逻辑(无 DB)**:
- 密码哈希 / 校验(bcryptjs round-trip)。
- 认证状态机转换(UNVERIFIED→PENDING→VERIFIED/REJECTED 的合法/非法跃迁)。
- 联系方式可见性判定(`resolveContactInfo` 各组合)。
- 权限 helper(`requireVerifiedUser` 在不同认证态的行为)。
- DB 集成测试(认证/审核真实流程)留到 P1 一并补。

**错误处理**:
- Zod 在所有 Server Action / Route Handler 边界校验,返回类型化错误。
- 优雅处理:唯一性冲突(邮箱/手机已注册)、重复提交认证、未授权访问。

**非功能(对应 PRD §10,P0 相关)**:
- 密码 bcrypt 存储 ✓
- 学生证照片仅管理员可见 ✓
- 软删除(`deletedAt`,查询默认排除已删)✓
- 所有操作校验登录 + 认证态 ✓

---

## 12. 环境变量(P0 所需)

```
DATABASE_URL=                    # Neon Postgres 连接串
AUTH_SECRET=                     # Auth.js JWT 密钥
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_PUBLIC=                # 公开桶
R2_BUCKET_PRIVATE=               # 私密桶
NEXT_PUBLIC_R2_PUBLIC_BASE_URL=  # 公开桶访问域名
ADMIN_EMAIL=                     # seed 首个管理员
```

---

## 13. P0 交付清单(Definition of Done)

- [ ] 项目脚手架:Next.js + Prisma + PostgreSQL + Auth.js + Tailwind/shadcn,本地与 Vercel 均可运行。
- [ ] 注册 / 登录 / 登出(邮箱或手机号 + 密码,bcrypt)。
- [ ] 会话 + `middleware.ts`(保护 `(app)` / `(admin)`)。
- [ ] 学生证认证:用户提交 → 管理员审核队列 → 通过/拒绝(含理由)+ 通知。
- [ ] R2 存储:公开(头像)/ 私密(学生证),预签名直传,私密仅管理员可读。
- [ ] 个人主页(强制公开字段 + 可选真名 + 认证标识 + 违规次数;信誉/历史占位)。
- [ ] 通知骨架(表 + helper + API + 铃铛 UI)。
- [ ] 权限 helper(`requireVerifiedUser` / `resolveContactInfo`)实现并被认证流程使用。
- [ ] 首个管理员 seed 脚本。
- [ ] 单元测试:密码校验、认证状态机、可见性判定、权限 helper。
- [ ] UI 各页面经 `frontend-design` skill 做过视觉设计。

---

## 14. 显式排除(P0 不做)

- 物品 / 服务 / 需求帖的任何业务逻辑(P1/P2)。
- Booking / Match 流程(P2)。
- 评价系统本体、违规写入逻辑、举报处理(P3)。
- 周模板自动生成可预约时间(PRD 标注为后续迭代)。
- 邮箱/短信验证码、OAuth、2FA、邮件通知。
