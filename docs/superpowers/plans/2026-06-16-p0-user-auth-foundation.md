# P0 用户系统 + 身份认证 + 个人主页 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superagents:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭好项目地基——用户注册/登录会话、学生证人工认证流程、个人主页、联系方式可见性底层、权限中间件、站内通知骨架、R2 图片存储——为 P1/P2/P3 所有面板打基础。

**Architecture:** Next.js 15 App Router 全栈,Prisma + PostgreSQL 建模,Auth.js v5(Credentials + JWT)管会话,权限/认证状态机/可见性等核心规则抽成 lib/ 纯函数(可单测),R2 预签名 POST 直传,私密对象仅管理员可读。

**Tech Stack:** Next.js 15 · React 19 · TypeScript · Prisma · PostgreSQL(Neon) · Auth.js v5 · bcryptjs · @aws-sdk/client-s3 + presigned-post · Tailwind + shadcn/ui · Vitest · Vercel

---

## 前置条件(开工前准备)

1. **Node 20+** 与 **pnpm**(未安装:`npm i -g pnpm`)。
2. **Neon** 项目一个,拿到 `DATABASE_URL`(pg 连接串)。
3. **Cloudflare R2**:建两个桶 `inform-trade-public`、`inform-trade-private`;R2 API Token(对象读写);记录 Account ID。
4. **AUTH_SECRET**:运行 `pnpm dlx auth secret`(自动写入 `.env.local`)或 `openssl rand -base64 32`。
5. **ADMIN_EMAIL**:首个管理员的邮箱(需与注册时一致)。

> 包管理器统一用 **pnpm**。若改用 npm/yarn,把 `pnpm <cmd>` 换成对应命令即可。

---

## 文件结构总览

```
src/
  app/
    layout.tsx                              # 根布局(Providers)
    page.tsx                                # 首页(占位,跳转/入口)
    globals.css                             # Tailwind
    (auth)/
      layout.tsx                            # 登录注册布局
      login/page.tsx                        # 登录
      register/page.tsx                     # 注册
    (app)/
      layout.tsx                            # 已登录布局(含顶部导航+通知铃铛)
      profile/[id]/page.tsx                 # 个人主页
      settings/page.tsx                     # 设置 + 学生证上传
    admin/
      verify/page.tsx                       # 管理员:认证审核
    api/
      auth/[...nextauth]/route.ts           # Auth.js 路由
      upload-url/route.ts                   # 预签名上传 URL
      notifications/route.ts                # 通知列表
      notifications/[id]/read/route.ts      # 标记已读
      admin/student-id/route.ts              # 管理员读取私密学生证(?key= 传参)
      cron/timeout/route.ts                 # Vercel Cron 占位(P1/P2 消费)
  lib/
    db.ts                                   # Prisma 单例
    auth.ts                                 # Auth.js 完整配置(Credentials + Prisma)
    password.ts                             # bcryptjs 哈希/校验
    permissions.ts                          # requireVerifiedUser / isAdmin
    notifications.ts                        # createNotification
    storage/r2.ts                           # R2 client + 预签名 POST
    storage/paths.ts                        # key 构造(public/private)
    validation/user.ts                      # register/login Zod schema
    verification/state-machine.ts           # 认证状态机(纯)
    verification/contact-visibility.ts      # 联系方式可见性(纯)
  auth.config.ts                            # edge-safe 配置(middleware 用)
  middleware.ts                             # 路由保护
  types/next-auth.d.ts                      # Session/JWT 类型扩展
components/
  nav.tsx, notification-bell.tsx, ...
prisma/schema.prisma
scripts/seed-admin.ts
vercel.json                                 # cron 配置
vitest.config.ts
.env.example, .nvmrc, package.json
```

---

## Task 1: 项目脚手架与工具链

**Files:**
- Create/生成: `package.json`, `tsconfig.json`, `next.config.ts`, Tailwind 配置(create-next-app 产出;最新版为 Tailwind v4,主题走 `src/app/globals.css` 的 CSS 变量), `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.example`, `.env.local`, `.nvmrc`, `.gitignore`, `vitest.config.ts`, `vercel.json`

- [ ] **Step 1: 创建 Next.js 项目(在仓库根目录初始化)**

```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint --use-pnpm
```

若提示目录非空(有 PRD.md / docs),选继续。完成后确认 `pnpm dev` 能启动。

- [ ] **Step 2: 安装运行时依赖**

```bash
pnpm add @prisma/client next-auth@beta @auth/core bcryptjs@^2.4.3 @aws-sdk/client-s3 @aws-sdk/s3-presigned-post zod
```

- [ ] **Step 3: 安装开发依赖**

```bash
pnpm add -D prisma @types/bcryptjs vitest @vitest/ui tsx
```

- [ ] **Step 4: 写 `.nvmrc`**

```
20
```

- [ ] **Step 5: 写 `.env.example`**

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Auth.js
AUTH_SECRET=""

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_PUBLIC="inform-trade-public"
R2_BUCKET_PRIVATE="inform-trade-private"
NEXT_PUBLIC_R2_PUBLIC_BASE_URL="https://pub.example.com"

# First admin
ADMIN_EMAIL=""

# Cron (Vercel) - shared secret to protect cron endpoint
CRON_SECRET=""
```

把真实值填入 `.env.local`(不入库)。

- [ ] **Step 6: 补充 `package.json` scripts**

在 `scripts` 中确保存在:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "seed:admin": "tsx scripts/seed-admin.ts"
  }
}
```

- [ ] **Step 7: 写 `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 8: 写 `vercel.json`(P0 仅配置 cron 占位,真正处理在 P1/P2)**

```json
{
  "crons": [
    { "path": "/api/cron/timeout", "schedule": "0 * * * *" }
  ]
}
```

- [ ] **Step 9: 校验 `tsconfig.json` 含 path 别名**

确认 `compilerOptions.paths` 含 `"@/*": ["./src/*"]`(create-next-app 已加,核对即可)。

- [ ] **Step 10: 验证可运行**

```bash
pnpm dev
```
Expected: 服务在 http://localhost:3000 启动,默认页可访问。Ctrl+C 停止。

- [ ] **Step 11: 提交**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Prisma + Auth.js + Tailwind project"
```

---

## Task 2: Prisma schema、客户端与首次迁移

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`
- Modify: `.env.local`(确认 DATABASE_URL 已填)

- [ ] **Step 1: 初始化 Prisma**

```bash
pnpm dlx prisma init --datasource-provider postgresql
```

(会生成 `prisma/schema.prisma` 与 `.env` 模板;把 DATABASE_URL 放 `.env.local`,删多余的 `.env` 模板或保留空。)

- [ ] **Step 2: 写 `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum Role {
  USER
  ADMIN
}

model User {
  id                  String             @id @default(cuid())
  email               String?            @unique
  phone               String?            @unique
  passwordHash        String
  realName            String
  studentId           String
  department          String
  enrollmentYear      Int
  nickname            String
  avatarKey           String?
  realNameVisible     Boolean            @default(false)
  verificationStatus  VerificationStatus @default(UNVERIFIED)
  violationCount      Int                @default(0)
  role                Role               @default(USER)
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt
  deletedAt           DateTime?

  verificationRequests VerificationRequest[]
  notifications        Notification[]

  @@index([verificationStatus])
}

enum VerificationReqStatus {
  PENDING
  APPROVED
  REJECTED
}

model VerificationRequest {
  id          String              @id @default(cuid())
  userId      String
  photoKeys   String[]
  status      VerificationReqStatus @default(PENDING)
  reviewerId  String?
  reason      String?
  submittedAt DateTime            @default(now())
  reviewedAt  DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([status, submittedAt])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  body      String
  link      String?
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read, createdAt])
}
```

- [ ] **Step 3: 生成客户端**

```bash
pnpm db:generate
```
Expected: `Generated Prisma Client`。

- [ ] **Step 4: 写 `src/lib/db.ts`(单例,避免 dev 热重载多实例)**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: 首次迁移(确保 DATABASE_URL 已填)**

```bash
pnpm db:migrate -- --name init
```
Expected: 生成 `prisma/migrations/<ts>_init/`,表创建成功。

- [ ] **Step 6: 提交**

```bash
git add prisma src/lib/db.ts
git commit -m "feat(db): add User, VerificationRequest, Notification schema + migration"
```

---

## Task 3: 密码哈希(TDD)

**Files:**
- Create: `src/lib/password.ts`, `src/lib/password.test.ts`

- [ ] **Step 1: 写失败测试**

`src/lib/password.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("hashes a password and verifies it", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toBe("correct horse battery staple");
    expect(hash.startsWith("$2")).toBe(true);
    await expect(verifyPassword("correct horse battery staple", hash)).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("hunter2");
    await expect(verifyPassword("nope", hash)).resolves.toBe(false);
  });

  it("produces different hashes for same password (salt)", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: 运行测试,确认失败**

```bash
pnpm test src/lib/password.test.ts
```
Expected: FAIL — `Cannot find module '@/lib/password'`。

- [ ] **Step 3: 写实现**

`src/lib/password.ts`:

```ts
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 4: 运行测试,确认通过**

```bash
pnpm test src/lib/password.test.ts
```
Expected: PASS(3 个用例)。

- [ ] **Step 5: 提交**

```bash
git add src/lib/password.ts src/lib/password.test.ts
git commit -m "feat(auth): add bcrypt password hashing helpers"
```

---

## Task 4: 认证状态机(TDD)

**Files:**
- Create: `src/lib/verification/state-machine.ts`, `src/lib/verification/state-machine.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from "vitest";
import {
  canSubmitVerification,
  userStatusAfterReview,
  isValidReview,
} from "@/lib/verification/state-machine";

describe("verification state machine", () => {
  it("allows submit only from UNVERIFIED or REJECTED", () => {
    expect(canSubmitVerification("UNVERIFIED")).toBe(true);
    expect(canSubmitVerification("REJECTED")).toBe(true);
    expect(canSubmitVerification("PENDING")).toBe(false);
    expect(canSubmitVerification("VERIFIED")).toBe(false);
  });

  it("maps review decision to user status", () => {
    expect(userStatusAfterReview("APPROVED")).toBe("VERIFIED");
    expect(userStatusAfterReview("REJECTED")).toBe("REJECTED");
  });

  it("only PENDING requests can be reviewed", () => {
    expect(isValidReview("PENDING", "APPROVED")).toBe(true);
    expect(isValidReview("PENDING", "REJECTED")).toBe(true);
    expect(isValidReview("APPROVED", "REJECTED")).toBe(false);
    expect(isValidReview("REJECTED", "APPROVED")).toBe(false);
  });
});
```

- [ ] **Step 2: 运行,确认失败**

```bash
pnpm test src/lib/verification/state-machine.test.ts
```
Expected: FAIL — 模块不存在。

- [ ] **Step 3: 写实现**

```ts
import { VerificationStatus } from "@prisma/client";

export type ReviewDecision = "APPROVED" | "REJECTED";

/** 用户当前状态是否允许发起新的认证申请 */
export function canSubmitVerification(status: VerificationStatus): boolean {
  return status === "UNVERIFIED" || status === "REJECTED";
}

/** 审核决定 → 用户状态 */
export function userStatusAfterReview(decision: ReviewDecision): VerificationStatus {
  return decision === "APPROVED" ? "VERIFIED" : "REJECTED";
}

/** 只有 PENDING 的申请可被审核 */
export function isValidReview(reqStatus: string, decision: ReviewDecision): boolean {
  return reqStatus === "PENDING";
}
```

- [ ] **Step 4: 运行,确认通过**

```bash
pnpm test src/lib/verification/state-machine.test.ts
```
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/verification/state-machine.ts src/lib/verification/state-machine.test.ts
git commit -m "feat(verification): add verification state machine"
```

---

## Task 5: 联系方式可见性解析(TDD)

**Files:**
- Create: `src/lib/verification/contact-visibility.ts`, `src/lib/verification/contact-visibility.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from "vitest";
import { resolveContactInfo } from "@/lib/verification/contact-visibility";

describe("resolveContactInfo", () => {
  const info = "wechat: abc123";

  it("EVERYONE: 未登录也能看到", () => {
    expect(resolveContactInfo({ visibility: "EVERYONE", contactInfo: info, viewerVerified: null })).toBe(info);
  });

  it("VERIFIED_ONLY: 未登录看不到", () => {
    expect(resolveContactInfo({ visibility: "VERIFIED_ONLY", contactInfo: info, viewerVerified: null })).toBeNull();
  });

  it("VERIFIED_ONLY: 未认证用户看不到", () => {
    expect(resolveContactInfo({ visibility: "VERIFIED_ONLY", contactInfo: info, viewerVerified: false })).toBeNull();
  });

  it("VERIFIED_ONLY: 已认证用户能看到", () => {
    expect(resolveContactInfo({ visibility: "VERIFIED_ONLY", contactInfo: info, viewerVerified: true })).toBe(info);
  });

  it("无联系方式时始终返回 null", () => {
    expect(resolveContactInfo({ visibility: "EVERYONE", contactInfo: undefined, viewerVerified: true })).toBeNull();
  });
});
```

- [ ] **Step 2: 运行,确认失败**

```bash
pnpm test src/lib/verification/contact-visibility.test.ts
```
Expected: FAIL。

- [ ] **Step 3: 写实现**

```ts
export type ContactVisibility = "VERIFIED_ONLY" | "EVERYONE";

export interface ContactContext {
  visibility: ContactVisibility;
  contactInfo?: string | null;
  /** null = 未登录; true = 已认证; false = 已登录未认证 */
  viewerVerified: boolean | null;
}

/** 按可见性策略 + 当前用户认证态,决定是否返回联系方式 */
export function resolveContactInfo(ctx: ContactContext): string | null {
  const { visibility, contactInfo, viewerVerified } = ctx;
  if (!contactInfo) return null;
  if (visibility === "EVERYONE") return contactInfo;
  // VERIFIED_ONLY
  return viewerVerified === true ? contactInfo : null;
}
```

- [ ] **Step 4: 运行,确认通过**

```bash
pnpm test src/lib/verification/contact-visibility.test.ts
```
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/verification/contact-visibility.ts src/lib/verification/contact-visibility.test.ts
git commit -m "feat(verification): add contact-info visibility resolver"
```

---

## Task 6: 权限 helper(TDD)

**Files:**
- Create: `src/lib/permissions.ts`, `src/lib/permissions.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from "vitest";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  NotVerifiedError,
  isAdmin,
} from "@/lib/permissions";

type U = { id: string; verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"; role: "USER" | "ADMIN" };

describe("permissions", () => {
  it("throws NotAuthenticatedError when no user", () => {
    expect(() => requireVerifiedUser(null)).toThrow(NotAuthenticatedError);
  });

  it("throws NotVerifiedError when not VERIFIED", () => {
    const u: U = { id: "1", verificationStatus: "UNVERIFIED", role: "USER" };
    expect(() => requireVerifiedUser(u)).toThrow(NotVerifiedError);
    u.verificationStatus = "PENDING";
    expect(() => requireVerifiedUser(u)).toThrow(NotVerifiedError);
  });

  it("returns the user when VERIFIED", () => {
    const u: U = { id: "1", verificationStatus: "VERIFIED", role: "USER" };
    expect(requireVerifiedUser(u)).toBe(u);
  });

  it("isAdmin checks role", () => {
    expect(isAdmin({ role: "ADMIN" } as U)).toBe(true);
    expect(isAdmin({ role: "USER" } as U)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});
```

- [ ] **Step 2: 运行,确认失败**

```bash
pnpm test src/lib/permissions.test.ts
```
Expected: FAIL。

- [ ] **Step 3: 写实现**

```ts
import { Role, VerificationStatus } from "@prisma/client";

export interface SessionUser {
  id: string;
  role: Role;
  verificationStatus: VerificationStatus;
}

export class NotAuthenticatedError extends Error {}
export class NotVerifiedError extends Error {}

/** 要求「已登录 + 已认证」,否则抛错。写操作调用方据此返回 401/403。 */
export function requireVerifiedUser(user: SessionUser | null): SessionUser {
  if (!user) throw new NotAuthenticatedError();
  if (user.verificationStatus !== "VERIFIED") throw new NotVerifiedError();
  return user;
}

export function isAdmin(user: Pick<SessionUser, "role"> | null): boolean {
  return user?.role === "ADMIN";
}
```

- [ ] **Step 4: 运行,确认通过**

```bash
pnpm test src/lib/permissions.test.ts
```
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/permissions.ts src/lib/permissions.test.ts
git commit -m "feat(auth): add permission helpers (requireVerifiedUser, isAdmin)"
```

---

## Task 7: Zod 校验 schema(轻量 TDD)

**Files:**
- Create: `src/lib/validation/user.ts`, `src/lib/validation/user.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validation/user";

describe("user validation", () => {
  it("register requires at least one of email/phone", () => {
    expect(
      registerSchema.safeParse({
        email: "a@b.com", phone: undefined, password: "123456",
        realName: "张三", studentId: "S1", department: "CS", enrollmentYear: 2024, nickname: "san",
      }).success
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        email: undefined, phone: undefined, password: "123456",
        realName: "张三", studentId: "S1", department: "CS", enrollmentYear: 2024, nickname: "san",
      }).success
    ).toBe(false);
  });

  it("login requires identifier + password", () => {
    expect(loginSchema.safeParse({ identifier: "a@b.com", password: "123456" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "", password: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 运行,确认失败**

```bash
pnpm test src/lib/validation/user.test.ts
```
Expected: FAIL。

- [ ] **Step 3: 写实现**

```ts
import { z } from "zod";

const emailOrPhone = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
}).refine((d) => Boolean(d.email || d.phone), {
  message: "邮箱与手机号至少填一项",
});

export const registerSchema = emailOrPhone.extend({
  password: z.string().min(6).max(72),
  realName: z.string().min(1).max(50),
  studentId: z.string().min(1).max(50),
  department: z.string().min(1).max(100),
  enrollmentYear: z.number().int().min(2000).max(2100),
  nickname: z.string().min(1).max(30),
  realNameVisible: z.boolean().optional().default(false),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 4: 运行,确认通过**

```bash
pnpm test src/lib/validation/user.test.ts
```
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/lib/validation
git commit -m "feat(validation): add register/login zod schemas"
```

---

## Task 8: R2 存储客户端 + 路径构造(路径函数 TDD)

**Files:**
- Create: `src/lib/storage/paths.ts`, `src/lib/storage/paths.test.ts`, `src/lib/storage/r2.ts`

- [ ] **Step 1: 写失败测试(路径构造纯函数)**

```ts
import { describe, it, expect } from "vitest";
import { avatarKey, studentIdKey } from "@/lib/storage/paths";

describe("storage paths", () => {
  it("avatar key is public/<id>/<rand>", () => {
    const k = avatarKey("user_123", "rand");
    expect(k).toBe("public/avatars/user_123/rand");
  });

  it("student-id key is private/<reqId>/<rand>", () => {
    const k = studentIdKey("req_456", "rand");
    expect(k).toBe("private/student-ids/req_456/rand");
  });
});
```

- [ ] **Step 2: 运行,确认失败**

```bash
pnpm test src/lib/storage/paths.test.ts
```
Expected: FAIL。

- [ ] **Step 3: 写路径函数**

```ts
export function avatarKey(userId: string, rand: string): string {
  return `public/avatars/${userId}/${rand}`;
}

export function studentIdKey(requestId: string, rand: string): string {
  return `private/student-ids/${requestId}/${rand}`;
}
```

- [ ] **Step 4: 运行,确认通过**

```bash
pnpm test src/lib/storage/paths.test.ts
```
Expected: PASS。

- [ ] **Step 5: 写 R2 客户端与预签名 POST**

`src/lib/storage/r2.ts`:

```ts
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const accountId = process.env.R2_ACCOUNT_ID!;

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface PresignOptions {
  bucket: string;
  key: string;
  /** 最大字节数 */
  maxBytes: number;
  /** 允许的 MIME 前缀,如 "image/" */
  contentTypePrefix: string;
}

/** 生成预签名 POST,在 R2 侧强制 MIME 前缀 + 大小上限。客户端需自行追加 Content-Type(见 Task 14)。*/
export async function presignUpload(opts: PresignOptions) {
  return createPresignedPost(r2, {
    Bucket: opts.bucket,
    Key: opts.key,
    Conditions: [
      ["content-length-range", 0, opts.maxBytes],
      ["starts-with", "$Content-Type", opts.contentTypePrefix],
    ],
    Expires: 60,
  });
}

export const BUCKETS = {
  public: process.env.R2_BUCKET_PUBLIC!,
  private: process.env.R2_BUCKET_PRIVATE!,
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
```

- [ ] **Step 6: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 7: 提交**

```bash
git add src/lib/storage
git commit -m "feat(storage): add R2 client and presigned-post helpers"
```

---

## Task 9: 通知 helper + API

**Files:**
- Create: `src/lib/notifications.ts`, `src/app/api/notifications/route.ts`, `src/app/api/notifications/[id]/read/route.ts`

- [ ] **Step 1: 写 `src/lib/notifications.ts`**

```ts
import { prisma } from "@/lib/db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  return prisma.notification.create({ data: params });
}

/** 未读数(导航栏红点用) */
export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}
```

- [ ] **Step 2: 写 `src/app/api/notifications/route.ts`(列表)**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ items });
}
```

- [ ] **Step 3: 写 `src/app/api/notifications/[id]/read/route.ts`(标记已读)**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  await prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { read: true },
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 5: 提交**

```bash
git add src/lib/notifications.ts src/app/api/notifications
git commit -m "feat(notifications): add createNotification helper + list/read APIs"
```

---

## Task 10: Auth.js 配置 + 路由 + middleware

**Files:**
- Create: `src/auth.config.ts`, `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`, `src/types/next-auth.d.ts`

- [ ] **Step 1: 写 `src/types/next-auth.d.ts`(类型扩展)**

```ts
import type { DefaultSession } from "next-auth";
import type { Role, VerificationStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      verificationStatus: VerificationStatus;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role?: Role;
    verificationStatus?: VerificationStatus;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    verificationStatus?: VerificationStatus;
  }
}
```

- [ ] **Step 2: 写 `src/auth.config.ts`(edge-safe,不含 Prisma)**

```ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [], // Credentials provider 加在 lib/auth.ts(middleware 不需要)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.verificationStatus = user.verificationStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.verificationStatus = token.verificationStatus as any;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] **Step 3: 写 `src/lib/auth.ts`(含 Credentials + Prisma)**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { identifier: {}, password: {} },
      async authorize(raw) {
        const identifier = String(raw?.identifier ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!identifier || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier }, { phone: identifier }],
            deletedAt: null,
          },
        });
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          role: user.role,
          verificationStatus: user.verificationStatus,
        };
      },
    }),
  ],
});
```

- [ ] **Step 4: 写 `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 5: 写 `src/middleware.ts`(路由保护)**

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const user = req.auth?.user;
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  const isProtectedUser = path.startsWith("/settings") || path.startsWith("/profile");
  const isAdminArea = path.startsWith("/admin");

  if (isAdminArea && !isAdmin) {
    return Response.redirect(new URL(isLoggedIn ? "/" : "/login", req.nextUrl));
  }
  if (isProtectedUser && !isLoggedIn) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("callbackUrl", path);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login|register|.*\\..*).*)"],
};
```

- [ ] **Step 6: 类型检查 + 构建**

```bash
pnpm typecheck && pnpm build
```
Expected: 无错误,build 成功。

- [ ] **Step 7: 提交**

```bash
git add src/auth.config.ts src/lib/auth.ts src/middleware.ts src/types/next-auth.d.ts src/app/api/auth
git commit -m "feat(auth): wire Auth.js v5 (Credentials + JWT) + middleware route protection"
```

---

## Task 11: 注册流程(action + 页面)

**Files:**
- Create: `src/app/(auth)/register/actions.ts`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/layout.tsx`

- [ ] **Step 1: 写注册 Server Action**

`src/app/(auth)/register/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation/user";

export type RegisterState = { error?: string };

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    email: (formData.get("email") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
    password: formData.get("password"),
    realName: formData.get("realName"),
    studentId: formData.get("studentId"),
    department: formData.get("department"),
    enrollmentYear: Number(formData.get("enrollmentYear")),
    nickname: formData.get("nickname"),
    realNameVisible: formData.get("realNameVisible") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "输入不合法" };
  }
  const d = parsed.data;

  // 唯一性检查
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: d.email ?? null }, { phone: d.phone ?? null }] },
  });
  if (existing) return { error: "该邮箱或手机号已注册" };

  const user = await prisma.user.create({
    data: {
      email: d.email ? d.email.toLowerCase() : null,
      phone: d.phone ?? null,
      passwordHash: await hashPassword(d.password),
      realName: d.realName,
      studentId: d.studentId,
      department: d.department,
      enrollmentYear: d.enrollmentYear,
      nickname: d.nickname,
      realNameVisible: d.realNameVisible,
    },
    select: { id: true },
  });

  await signIn("credentials", {
    identifier: (d.email ?? d.phone) as string,
    password: d.password,
    redirect: false,
  });
  redirect(`/profile/${user.id}`);
}
```

- [ ] **Step 2: 写 `(auth)/layout.tsx`**

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen flex items-center justify-center p-6">{children}</main>;
}
```

- [ ] **Step 3: 写 `register/page.tsx`(功能版,视觉由 Task 21 提升)**

```tsx
"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";
import Link from "next/link";

export default function RegisterPage() {
  const [state, formAction] = useActionState<RegisterState, FormData>(registerAction, {});

  return (
    <form action={formAction} className="w-full max-w-md space-y-3 rounded-lg border p-6">
      <h1 className="text-xl font-semibold">注册</h1>
      {state.error && <p className="text-red-600">{state.error}</p>}
      <input name="email" type="email" placeholder="邮箱(与手机号二选一)" className="w-full border p-2" />
      <input name="phone" placeholder="手机号(与邮箱二选一)" className="w-full border p-2" />
      <input name="password" type="password" placeholder="密码(至少6位)" className="w-full border p-2" />
      <input name="realName" placeholder="真实姓名" className="w-full border p-2" />
      <input name="studentId" placeholder="学号" className="w-full border p-2" />
      <input name="department" placeholder="院系" className="w-full border p-2" />
      <input name="enrollmentYear" type="number" placeholder="入学年份" className="w-full border p-2" />
      <input name="nickname" placeholder="昵称" className="w-full border p-2" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="realNameVisible" /> 公开真实姓名
      </label>
      <button type="submit" className="w-full rounded bg-black p-2 text-white">注册并登录</button>
      <p className="text-sm">
        已有账号?<Link href="/login" className="underline">登录</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 5: 提交**

```bash
git add "src/app/(auth)"
git commit -m "feat(auth): add registration server action and page"
```

---

## Task 12: 登录流程(action + 页面)

**Files:**
- Create: `src/app/(auth)/login/actions.ts`, `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: 写登录 Server Action**

```ts
"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/user";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "请输入账号和密码" };

  try {
    await signIn("credentials", {
      identifier: parsed.data.identifier,
      password: parsed.data.password,
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "邮箱/手机号或密码错误" };
    }
    throw e; // NEXT_REDIRECT,由框架处理
  }
  return {};
}
```

- [ ] **Step 2: 写 `login/page.tsx`**

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="w-full max-w-md space-y-3 rounded-lg border p-6">
      <h1 className="text-xl font-semibold">登录</h1>
      {state.error && <p className="text-red-600">{state.error}</p>}
      <input name="identifier" placeholder="邮箱或手机号" className="w-full border p-2" />
      <input name="password" type="password" placeholder="密码" className="w-full border p-2" />
      <button type="submit" className="w-full rounded bg-black p-2 text-white">登录</button>
      <p className="text-sm">
        没有账号?<Link href="/register" className="underline">注册</Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add "src/app/(auth)/login"
git commit -m "feat(auth): add login server action and page"
```

---

## Task 13: 预签名上传 API

**Files:**
- Create: `src/app/api/upload-url/route.ts`

- [ ] **Step 1: 写接口**

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BUCKETS, MAX_IMAGE_BYTES, presignUpload } from "@/lib/storage/r2";
import { avatarKey, studentIdKey } from "@/lib/storage/paths";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json()) as { purpose: "avatar" | "student-id" };
  const userId = session.user.id;

  const rand = crypto.randomUUID();
  let bucket: string;
  let key: string;

  if (body.purpose === "avatar") {
    bucket = BUCKETS.public;
    key = avatarKey(userId, rand);
  } else {
    // student-id 需要已认证?不:未认证也可提交认证申请,只要有登录态
    bucket = BUCKETS.private;
    // requestId 在前端创建申请前用临时 id 占位;这里用 user+rand,真正提交时回填
    key = studentIdKey(`u_${userId}`, rand);
  }

  const post = await presignUpload({
    bucket,
    key,
    maxBytes: MAX_IMAGE_BYTES,
    contentTypePrefix: "image/",
  });

  return NextResponse.json({ post, key });
}
```

- [ ] **Step 2: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/app/api/upload-url
git commit -m "feat(storage): add presigned upload-url endpoint (avatar / student-id)"
```

---

## Task 14: 设置页 —— 学生证认证提交

**Files:**
- Create: `src/app/(app)/settings/page.tsx`, `src/app/(app)/settings/actions.ts`

- [ ] **Step 1: 写提交 Server Action**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canSubmitVerification } from "@/lib/verification/state-machine";
import { createNotification } from "@/lib/notifications";

export type SubmitState = { error?: string; ok?: boolean };

export async function submitVerificationAction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "用户不存在" };
  if (!canSubmitVerification(user.verificationStatus)) {
    return { error: "当前状态无法提交认证(审核中或已认证)" };
  }

  const keys = String(formData.get("photoKeys") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (keys.length === 0) return { error: "请上传至少一张学生证照片" };

  // 已有 PENDING 则不允许(并发兜底)
  const pending = await prisma.verificationRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (pending) return { error: "已有待审核的申请" };

  await prisma.verificationRequest.create({
    data: { userId: user.id, photoKeys: keys },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationStatus: "PENDING" },
  });

  // 通知(占位:可后续给管理员发;此处仅给用户自己留痕)
  await createNotification({
    userId: user.id,
    type: "verification_submitted",
    title: "认证申请已提交",
    body: "你的学生证认证申请已提交,等待管理员审核。",
    link: "/settings",
  });

  revalidatePath("/settings");
  return { ok: true };
}
```

- [ ] **Step 2: 写页面(上传逻辑 + 状态展示)**

`src/app/(app)/settings/page.tsx`:

```tsx
"use client";

import { useActionState, useState } from "react";
import { submitVerificationAction, type SubmitState } from "./actions";

export default function SettingsPage({ verificationStatus }: { verificationStatus: string }) {
  const [keys, setKeys] = useState<string[]>([]);
  const [state, formAction] = useActionState<SubmitState, FormData>(submitVerificationAction, {});

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const uploaded: string[] = [];
    for (const file of files) {
      const { post, key } = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "student-id" }),
      }).then((r) => r.json());

      const form = new FormData();
      Object.entries(post.fields).forEach(([k, v]) => form.append(k, v as string));
      form.append("Content-Type", file.type); // 匹配 presign 的 starts-with image/ 条件
      form.append("file", file); // file 必须最后追加
      await fetch(post.url, { method: "POST", body: form });
      uploaded.push(key);
    }
    setKeys(uploaded);
  }

  return (
    <div className="max-w-lg space-y-4 p-6">
      <h1 className="text-xl font-semibold">设置</h1>
      <p>认证状态:<strong>{verificationStatus}</strong></p>

      <form action={formAction} className="space-y-2 border-t pt-4">
        <h2 className="font-medium">学生证认证</h2>
        <input type="file" accept="image/*" multiple onChange={handleFile} />
        <input type="hidden" name="photoKeys" value={keys.join(",")} />
        {state.error && <p className="text-red-600">{state.error}</p>}
        {state.ok && <p className="text-green-600">已提交,等待审核。</p>}
        <button type="submit" className="rounded bg-black p-2 text-white">提交认证</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: 把 settings 改为 Server Component 传入 status(拆分数据获取)**

由于上面是 client 组件,需要一个 server 入口传 `verificationStatus`。新建 `src/app/(app)/settings/layout.tsx`? 更简单:把 page 改为 server,渲染一个 client 子组件。调整:

把 `page.tsx` 重命名为 `settings-form.tsx`(上面的 client 代码),并新建 server 版 `page.tsx`:

`src/app/(app)/settings/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { verificationStatus: true },
  });
  return <SettingsForm verificationStatus={user?.verificationStatus ?? "UNVERIFIED"} />;
}
```

并把 step 2 的文件名改为 `settings-form.tsx`、导出 `export default function SettingsForm(...)`。

- [ ] **Step 4: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 5: 提交**

```bash
git add "src/app/(app)/settings"
git commit -m "feat(verification): student-id submission on settings page"
```

---

## Task 15: 管理员认证审核页

**Files:**
- Create: `src/app/admin/verify/page.tsx`, `src/app/admin/verify/actions.ts`

- [ ] **Step 1: 写审核 Server Action**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { isValidReview, userStatusAfterReview, type ReviewDecision } from "@/lib/verification/state-machine";
import { createNotification } from "@/lib/notifications";

export type ReviewState = { error?: string };

export async function reviewAction(formData: FormData): Promise<ReviewState> {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) return { error: "无权限" };

  const requestId = String(formData.get("requestId"));
  const decision = String(formData.get("decision")) as ReviewDecision;
  if (decision !== "APPROVED" && decision !== "REJECTED") return { error: "非法决定" };
  const reason = formData.get("reason") ? String(formData.get("reason")) : null;

  const req = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
  if (!req) return { error: "申请不存在" };
  if (!isValidReview(req.status, decision)) return { error: "该申请无法审核" };

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: decision, reviewerId: session!.user!.id, reviewedAt: new Date(), reason },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { verificationStatus: userStatusAfterReview(decision) },
    }),
  ]);

  await createNotification({
    userId: req.userId,
    type: decision === "APPROVED" ? "verification_approved" : "verification_rejected",
    title: decision === "APPROVED" ? "认证已通过" : "认证未通过",
    body: decision === "APPROVED" ? "你的学生证认证已通过。" : `认证未通过。${reason ?? ""}`.trim(),
    link: "/settings",
  });

  revalidatePath("/admin/verify");
  return {};
}
```

- [ ] **Step 2: 写审核页(server)**

```tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { reviewAction } from "./actions";

export default async function AdminVerifyPage() {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) redirect("/");

  const requests = await prisma.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: { realName: true, studentId: true, department: true, email: true, phone: true } } },
  });

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">认证审核</h1>
      {requests.map((r) => (
        <div key={r.id} className="space-y-2 rounded-lg border p-4">
          <p>姓名:{r.user.realName} · 学号:{r.user.studentId} · 院系:{r.user.department}</p>
          <p>账号:{r.user.email ?? r.user.phone}</p>
          <div className="flex flex-wrap gap-2">
            {r.photoKeys.map((k) => (
              // 通过私密接口由管理员读取(下一 Task 实现)
              <img key={k} src={`/api/admin/student-id?key=${encodeURIComponent(k)}`} alt="学生证" className="h-32 border" />
            ))}
          </div>
          <form action={reviewAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="requestId" value={r.id} />
            <input name="reason" placeholder="拒绝理由(拒绝时填)" className="flex-1 border p-1" />
            <button name="decision" value="APPROVED" className="rounded bg-green-600 p-2 text-white">通过</button>
            <button name="decision" value="REJECTED" className="rounded bg-red-600 p-2 text-white">拒绝</button>
          </form>
        </div>
      ))}
      {requests.length === 0 && <p className="text-gray-500">暂无待审核申请。</p>}
    </div>
  );
}
```

- [ ] **Step 3: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add src/app/admin/verify
git commit -m "feat(admin): verification review page (approve/reject + notify)"
```

---

## Task 16: 私密学生证读取接口(仅管理员)

**Files:**
- Create: `src/app/api/admin/student-id/route.ts`

- [ ] **Step 1: 写接口(流式返回私密对象)**

```ts
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { r2, BUCKETS } from "@/lib/storage/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) {
    return new Response("Forbidden", { status: 403 });
  }
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return new Response("Missing key", { status: 400 });

  const obj = await r2.send(
    new GetObjectCommand({ Bucket: BUCKETS.private, Key: key })
  );
  if (!obj.Body) return new Response("Not found", { status: 404 });

  return new Response(obj.Body as Readable, {
    headers: { "Content-Type": obj.ContentType ?? "image/*", "Cache-Control": "no-store" },
  });
}
```

> 说明:私密 key 形如 `private/student-ids/u_xxx/<rand>`,含 `/`,用查询参数 `?key=<encodeURIComponent>` 传递(见 Task 15),避免动态路径段歧义。这里直接从 `searchParams` 读取。

- [ ] **Step 2: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/app/api/admin/student-id
git commit -m "feat(admin): private student-id read endpoint (admin-only)"
```

---

## Task 17: 个人主页

**Files:**
- Create: `src/app/(app)/profile/[id]/page.tsx`

- [ ] **Step 1: 写主页(server)**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  UNVERIFIED: "未认证",
  PENDING: "审核中",
  VERIFIED: "已认证",
  REJECTED: "认证未通过",
};

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      nickname: true, avatarKey: true, department: true, enrollmentYear: true,
      realName: true, realNameVisible: true, verificationStatus: true, violationCount: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <header className="flex items-center gap-4">
        {user.avatarKey ? (
          <img src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${user.avatarKey}`} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-200" />
        )}
        <div>
          <h1 className="text-xl font-semibold">{user.nickname}</h1>
          <p className="text-sm text-gray-600">
            {user.department} · {user.enrollmentYear} · {STATUS_LABEL[user.verificationStatus]}
            {user.realNameVisible && ` · ${user.realName}`}
          </p>
        </div>
      </header>

      <section className="rounded-lg border p-4">
        <p>违规次数:{user.violationCount}</p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">物品交易信誉</h2>
          <p className="text-sm text-gray-500">均分 — · 完成 0 笔</p>
          <p className="text-sm text-gray-400">(P3 填充)</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">服务交易信誉</h2>
          <p className="text-sm text-gray-500">均分 — · 完成 0 次</p>
          <p className="text-sm text-gray-400">(P3 填充)</p>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="font-medium">发布历史</h2>
        <p className="text-sm text-gray-400">(P1/P2 填充)</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add "src/app/(app)/profile"
git commit -m "feat(profile): public user profile page with reputation/history placeholders"
```

---

## Task 18: 顶部导航 + 通知铃铛

**Files:**
- Create: `src/components/notification-bell.tsx`, `src/components/nav.tsx`, `src/app/(app)/layout.tsx`

- [ ] **Step 1: 写铃铛组件(client)**

```tsx
"use client";

import { useEffect, useState } from "react";

export function NotificationBell() {
  const [unread, setUnread] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ id: string; title: string; body: string; read: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/notifications").then((r) => r.json()).then((d) => {
      setItems(d.items ?? []);
      setUnread((d.items ?? []).filter((i: any) => !i.read).length);
    });
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
    setUnread((u) => (u ? u - 1 : 0));
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative">
        🔔
        {unread ? <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-xs text-white">{unread}</span> : null}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded border bg-white p-2 shadow">
          {items.length === 0 && <p className="text-sm text-gray-500">暂无通知</p>}
          {items.map((i) => (
            <button
              key={i.id}
              onClick={() => markRead(i.id)}
              className={`block w-full text-left p-2 text-sm ${i.read ? "text-gray-400" : "font-medium"}`}
            >
              {i.title}
              <span className="block text-xs text-gray-500">{i.body}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: 写导航(server,按登录态渲染)**

```tsx
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { NotificationBell } from "./notification-bell";

export async function Nav() {
  const session = await auth();
  return (
    <nav className="flex items-center justify-between border-b px-4 py-2">
      <Link href="/" className="font-semibold">校园信息流转平台</Link>
      <div className="flex items-center gap-3">
        {session?.user ? (
          <>
            <Link href={`/profile/${session.user.id}`} className="text-sm">我的主页</Link>
            <Link href="/settings" className="text-sm">设置</Link>
            {session.user.role === "ADMIN" && <Link href="/admin/verify" className="text-sm">审核</Link>}
            <NotificationBell />
            <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
              <button className="text-sm">登出</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm">登录</Link>
            <Link href="/register" className="text-sm">注册</Link>
          </>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: 写 `(app)/layout.tsx`**

```tsx
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Nav />
      {children}
    </div>
  );
}
```

> 注意:根 `app/layout.tsx` 需包住 `(app)` 与 `(auth)` 两个组。把 `Nav` 放在 `(app)` 组的 layout 内,登录注册页 `(auth)` 不显示导航——符合预期。若希望全局导航,改放根 layout;P0 保持现状即可。

- [ ] **Step 4: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 5: 提交**

```bash
git add src/components "src/app/(app)/layout.tsx"
git commit -m "feat(ui): top nav with notification bell + unread badge"
```

---

## Task 19: 首个管理员 seed 脚本

**Files:**
- Create: `scripts/seed-admin.ts`

- [ ] **Step 1: 写脚本**

```ts
import { prisma } from "../src/lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) throw new Error("请设置 ADMIN_EMAIL 环境变量");

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error(`未找到邮箱为 ${email} 的用户,请先注册该账号`);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN", verificationStatus: "VERIFIED" },
  });
  console.log(`已将 ${updated.email} 设为 ADMIN`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: 运行流程说明(需先注册该邮箱账号)**

```bash
# 1) 先在 /register 注册 ADMIN_EMAIL 对应账号
# 2) 再执行:
pnpm seed:admin
```
Expected: `已将 <email> 设为 ADMIN`。

- [ ] **Step 3: 提交**

```bash
git add scripts/seed-admin.ts
git commit -m "chore: add first-admin seed script"
```

---

## Task 20: Vercel Cron 占位接口

**Files:**
- Create: `src/app/api/cron/timeout/route.ts`

- [ ] **Step 1: 写占位接口(P1/P2 实现 7 天超时逻辑)**

```ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // TODO(P1/P2): 扫描超过 7 天未确认的 Pending Booking/Match/Item,标记 Completed
  return NextResponse.json({ ok: true, scanned: 0 });
}
```

- [ ] **Step 2: 类型检查**

```bash
pnpm typecheck
```
Expected: 无错误。

- [ ] **Step 3: 提交**

```bash
git add src/app/api/cron
git commit -m "feat(cron): placeholder timeout endpoint for 7-day auto-complete (P1/P2)"
```

---

## Task 21: UI 视觉设计(frontend-design skill)

> 此任务调用 `frontend-design` skill,为 P0 所有页面建立统一、美观的视觉语言。**在前面的功能页面已能跑通后执行。**

**Files:**
- Modify: `src/app/globals.css`, `tailwind.config.ts`, 以及下列页面的样式
- Pages: `(auth)/login`, `(auth)/register`, `(app)/profile/[id]`, `(app)/settings`, `admin/verify`, `components/nav`, `components/notification-bell`

- [ ] **Step 1: 调用 frontend-design skill**

```
使用 frontend-design skill,为「港科大(广州)校园二手交易与咨询信息平台」设计视觉系统。
设计意图:值得信赖、干净、校园感、中文界面。要求:统一配色/字体/间距/圆角/阴影;定义
按钮、输入框、卡片、徽章(认证状态)、空状态等组件样式。需要美化的页面:登录、注册、
个人主页、设置(含学生证上传)、管理员审核页、顶部导航与通知铃铛。
```

- [ ] **Step 2: 按 skill 产出的设计更新全局样式与组件**

按设计稿更新主题(最新 create-next-app 用 Tailwind v4,主题走 `src/app/globals.css` 的 CSS 变量;如需 shadcn 组件,先执行 `pnpm dlx shadcn@latest init`)、各页面 className。

- [ ] **Step 3: 校验不破坏功能**

```bash
pnpm typecheck && pnpm build
```
Expected: 无错误。

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "style: apply frontend-design visual system to P0 pages"
```

---

## Task 22: 全量验证与冒烟手册

**Files:**
- Create: `docs/superpowers/runbooks/p0-smoke-test.md`

- [ ] **Step 1: 跑全部单测**

```bash
pnpm test
```
Expected: 所有 lib 单测通过(password / state-machine / contact-visibility / permissions / validation / paths)。

- [ ] **Step 2: 类型检查 + lint + 构建**

```bash
pnpm typecheck && pnpm lint && pnpm build
```
Expected: 全部通过。

- [ ] **Step 3: 写冒烟手册 `docs/superpowers/runbooks/p0-smoke-test.md`**

记录手工验证步骤(本地 `pnpm dev` + Neon + R2 已配置):

1. `/register` 用 email 注册 → 自动登录并跳转个人主页,认证状态「未认证」。
2. `/settings` 上传一张学生证图(>5MB 应被 R2 拒绝;正常图上传成功)→ 提交 → 状态变「审核中」,通知出现。
3. 用 `ADMIN_EMAIL` 注册另一账号 → `pnpm seed:admin` → 以管理员登录。
4. `/admin/verify` 看到申请 + 学生证图 → 点「通过」→ 原用户状态变「已认证」,收到通知。
5. 重复一次走「拒绝 + 理由」路径 → 状态「认证未通过」,用户可重新提交。
6. 未登录访问 `/settings` → 跳 `/login`;非管理员访问 `/admin/verify` → 跳 `/`。
7. 私密学生证 URL 直接访问(`/api/admin/student-id/...`)未登录/非管理员 → 403。

- [ ] **Step 4: 提交**

```bash
git add docs/superpowers/runbooks/p0-smoke-test.md
git commit -m "docs: add P0 smoke-test runbook"
```

---

## 自检(对照 spec)

- **覆盖**:spec §3 数据模型 → Task 2;§4 认证 → Task 3/10/11/12;§5 存储 → Task 8/13/16;§6 认证流程 → Task 4/14/15;§7 权限 → Task 6/10;§8 主页 → Task 17;§9 通知 → Task 9/18;§11 测试 → Task 3-7/22;§13 DoD 逐项对应 Task 1-22;§12 环境变量 → Task 1 `.env.example`。无遗漏。
- **占位符**:无 TBD/TODO(Task 20 的 TODO 是有意标注给 P1/P2 的,非本计划缺口)。
- **命名一致**:`requireVerifiedUser`、`canSubmitVerification`、`userStatusAfterReview`、`resolveContactInfo`、`presignUpload`、`avatarKey/studentIdKey`、`createNotification` 在各 Task 中一致。
- **类型一致**:Session/JWT 经 `types/next-auth.d.ts` 扩展;`SessionUser` 与 Auth.js `session.user` 字段(id/role/verificationStatus)一致。

## 注意点(执行时留意)

- **R2 私密读取 key 编码**:私密 key 含 `/`,Task 15/16 一律用查询参数 `?key=<encodeURIComponent>` 传递,Task 16 从 `searchParams` 读取,避免路径段歧义。
- **Auth.js middleware 不含 Prisma**:严格保持 `auth.config.ts`(edge)与 `lib/auth.ts`(含 Prisma)分离,否则 middleware 在 edge runtime 报错。
- **Cron secret**:`/api/cron/timeout` 必须校验 `CRON_SECRET`,避免外部触发。
- **DB 集成测试**:按 spec,P0 只做纯逻辑单测;真实流程靠 Task 22 冒烟手册覆盖。

---

## 执行交接

计划已保存至 `docs/superpowers/plans/2026-06-16-p0-user-auth-foundation.md`。两种执行方式:

**1. Subagent 驱动(推荐)** — 每个 Task 派一个全新 subagent 执行,任务间我做 review,迭代快、上下文干净。

**2. 内联执行** — 在当前会话用 executing-plans 批量执行,带检查点 review。

你选哪种?
