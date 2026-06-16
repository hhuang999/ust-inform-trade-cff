# 前端重构 + 全产品实现方案

> 日期：2026-06-17。基于对 `coze/` 参考项目（同一产品"校园枢纽 · HKUST(GZ)"的设计基准）的深度研究 + 我方前端审计 + PRD 功能盘点综合而成。
> 目标：把现有"靛蓝学院风"前端重构为 coze 的**纸感风**（温暖纸感、人文、柔和排版、安静阅读），同时补齐 PRD 中尚未实现的全部功能与匹配的后端，使整个 app 功能完整、可直接上线。

---

## 0. 关键决策（自主裁定，遵循"自主执行"授权）

| # | 议题 | 决策 |
|---|---|---|
| 1 | 暗色模式 | **亮色为主**。保留 `prefers-color-scheme: dark`，但暗色令牌改为**暖棕墨色系**（不再用冷蓝灰 #0b1120，避免破坏纸感）。暂不加切换控件（P5 再加）。 |
| 2 | 品牌色 | **替换为暖橙棕 #C96F3D**（纸感基准）。现有靛蓝 #4f46e5 弃用。 |
| 3 | 正文字体 | 标题/价格/数字用**衬线**（Lora + Noto Serif SC 回落宋体）+ `tabular-nums`；正文保留无衬线（中文小字衬线偏糊）。 |
| 4 | 首页角色 | **发现优先**：未登录也能浏览物品/服务；鉴权动作（"我想要"/发布）触发登录引导。 |
| 5 | 应用壳 | 采纳**固定顶栏(h-16) + 左侧栏(w-60，<lg 折叠为 Drawer) + 主区独立滚动**。 |
| 6 | 后端就绪度 | P1/P2/P3 后端**未实现** → 本次**一并构建**（Prisma 模型 + actions + 状态机）。 |
| 7 | 移动端侧栏 | <lg 折叠为汉堡 Drawer。 |
| 8 | 图片上传 | 复用 `/api/upload-url`，扩展支持多图 + 进度。 |
| 9 | 站内信/IM | **不做**。PRD 明确平台不介入交易沟通，仅站内通知。 |

---

## 1. 设计语言（纸感风落地）

- 背景 `#FBF3E7` 米黄、卡片 `#FFF9F1`、文本 `#31251B` 暖深棕、次文本 `#8B7662`、强调 `#C96F3D`、柔和绿（已认证）`#7E9F7A`。
- 边角圆润、阴影轻柔（暖棕 `rgba(193,165,124,*)` 三档）、衬线标题、安静阅读、克制动效。
- **禁忌**：强霓虹、深色科技背景、过度商业化 CTA。

### 1.1 设计令牌（直接写进 `src/app/globals.css`）

`:root`（十六进制）：
```
--background:#FBF3E7; --foreground:#31251B;
--card:#FFF9F1; --card-foreground:#31251B;
--muted:#F2E6D0; --muted-foreground:#8B7662;
--border:#DCC8A8; --input:#DCC8A8; --ring:#C96F3D;
--primary:#C96F3D; --primary-foreground:#FFFFFF;
--accent:#F5DCC8; --accent-foreground:#31251B;
--popover:#FFF9F1; --popover-foreground:#31251B;
--secondary:#F2E6D0; --secondary-foreground:#31251B;
--destructive:#C84A3D; --destructive-foreground:#FFFFFF;
/* 多级 surface */
--surface:#FFF9F1; --surface-container-lowest:#FFFCF7; --surface-container:#F2E6D0;
--surface-container-high:#EAD9BC; --surface-container-highest:#DEC9A4;
--primary-container:#F5DCC8; --outline:#C9B89C; --outline-variant:#DCC8A8;
/* 语义（改名不改义） */
--verified:#7E9F7A; --verified-soft:rgba(126,159,122,.15);
--pending:#D4A356; --pending-soft:rgba(212,163,86,.15);
--rejected:#C84A3D; --rejected-soft:rgba(200,74,61,.15);
--unverified:#8B7662; --unverified-soft:rgba(139,118,98,.12);
```
`@theme inline`（映射 + radius + 阴影 + 字体）：
```
--color-*: 上述令牌全量映射（含 --color-surface*、--color-on-surface*、--color-outline*、--color-primary 等）；
--color-destructive / --color-success / --color-warning / --color-error;
--radius-sm:.5rem; --radius-md:.75rem; --radius-lg:1rem; --radius-xl:1.25rem; --radius-2xl:1.5rem; --radius-full:9999px; --radius:var(--radius-md);
--shadow-sm:0 2px 8px rgba(193,165,124,.10); --shadow-md:0 2px 8px rgba(193,165,124,.12);
--shadow-lg:0 8px 24px rgba(193,165,124,.18);
--shadow-card:0 2px 8px rgba(193,165,124,.12); --shadow-float:0 8px 24px rgba(193,165,124,.18); --shadow-dialog:0 20px 40px rgba(193,165,124,.22);
--font-serif:var(--font-serif),var(--font-cjk-serif),"Georgia","Songti SC",serif;
--font-sans:var(--font-geist-sans),"PingFang SC","Microsoft YaHei",...;
```
暗色（暖棕墨色）：`--background:#2a2118; --foreground:#f5e9d6; --card:#332a20; --muted:#3d3225; --muted-foreground:#b8a68a; --border:#4a3d2e; --primary:#E08A4B;` 等。

### 1.2 字体 / 动效 / 布局

- `next/font/google` 加载 `Lora`(500/600/700) + `Noto_Serif_SC`(500/600/700)，保留 Geist。
- 动效：引入 `tw-animate-css`，`globals.css` 顶部 `@import "tw-animate-css"`；仅三档 duration（200 卡片/输入、300 图片缩放、500 滚动入场）；卡片 `hover:-translate-y-1 hover:shadow-float`、按钮 `active:scale-[.98]`、入场 `animate-in fade-in slide-in-from-bottom-4 duration-500`。
- 布局：顶栏/页脚 `max-w-[1400px]`，内容区 `max-w-[1200px] mx-auto px-8`；应用壳顶栏 `h-16`、侧栏 `w-60`、主区 `calc(100vh-4rem)` 独立滚动；网格 `gap-4`（物品 2/3/4 列，服务/需求 1/2/3 列）。

---

## 2. 组件库补齐

策略：**从 `coze/src/components/ui/` 复制**（已是 Next16+React19+Tailwind4+cva+cn 的 shadcn new-york，与本仓库同栈同别名），确保 `cn`/别名就绪后即可用，再按纸感令牌微调。

- **P0 必需**：`lib/utils.ts`(cn)、`use-mobile`、`sonner`(+根 layout 挂 `<Toaster/>`)、`skeleton`、`empty`、`spinner`、`dialog`、`sheet`、`drawer`、`select`、`dropdown-menu`、`textarea`(独立)、`label`。
- **P1 重要**：`avatar`、`separator`、`tabs`、`tooltip`、`alert`、`alert-dialog`、`switch`、`checkbox`、`radio-group`、`progress`、`carousel`、`pagination`。
- **P2 按需**：`command`、`calendar`、`input-group`、`item`、`button-group`、`scroll-area`。
- **对齐现有 4 组件**：`card`→`rounded-xl shadow-card gap-6 py-6 px-6`；`button`→cva + 变体（保留业务 `primary/ghost/danger/success/outline` 名 + 加 shadcn `default/destructive/secondary/link`）；`input`→补 `aria-invalid` 错误环、拆出 `textarea`；`badge`→确认变体、保留 `VERIFICATION_STATUS` 映射。

---

## 3. 页面重设计（现有 P0 六页）

- **首页 `/`**：暖色渐变 Hero + 衬线大标题 + 大搜索框 + 热门标签 + 统计栏 + 最新物品/推荐服务/最新需求网格 + 订阅卡 + 页脚（7 区块，发现优先）。
- **`/login`、`/register`**：纸感卡 + 字段级 zod 校验 + 密码可见切换 + toast；register 可选 split 布局。
- **`/profile/[id]**`：`Avatar` + `EmptyState` + `loading.tsx` + 历史 Tabs（物品/服务/需求）+ 信誉两栏（P3 填充）。
- **`/settings`**：上传缩略图预览网格 + 进度 + 文件校验 + 当前认证状态卡 + toast。
- **`/admin/verify`**：`loading.tsx` + 操作 toast + 拒绝理由必填 + 含姓名 alt + 列表入场动效。

---

## 4. 新功能页面（未实现，需匹配后端）

- **P1 物品面板**：`/items`(列表+筛选+搜索+排序+分页)、`/items/[id]`(双栏详情+意向人+安全提示)、`/items/new` & `/items/[id]/edit`(发布表单+多图+暂存)。
- **P1 订单/撮合**：`/me/items`(状态时间线+确认完成+取消免责 Dialog)、`/me/bookings`、`/me/matches`。
- **P1 通知中心**：`/notifications`(分组+全部已读+行动型内联按钮+分页)。
- **P2 服务/需求**：`/services` & `/needs`(双广场 Tab)、`/services/new` & `/needs/new`、`/services/[id]` & `/needs/[id]`(详情+可预约时间)。
- **P3**：评价弹窗(Completed 后) + 主页信誉聚合(双盲/30天公开) + 举报通用弹窗 + `/admin` 后台扩展(举报处理/物品审核/手动加违规/数据看板占位)。

### 4.1 匹配的后端（本次一并构建）

新增 Prisma 模型：`Item`(含图片/价格模式/分类/状态)、`Service`、`Need`、`Favorite`、`WaitingList`("我想要")、`Booking`(服务预约)、`Match`(撮合/选择交易对象)、`Review`(双盲)、`Report`、`Violation`；扩展 `Notification` 类型。状态机：物品 `AVAILABLE→RESERVED→SOLD`；撮合 `REQUESTED→MATCHED→CONFIRMED→COMPLETED/CANCELLED`（含 7 天自动完成 cron + 取消免责/计违规）。Server actions + 必要 API 路由 + Zod 校验 + 权限复用 `requireVerifiedUser`。

---

## 5. 分阶段路线

| Phase | 范围 | 关键交付 |
|---|---|---|
| 0 基建 | 依赖、令牌、字体、cn、components.json | 装依赖(cva/clsx/tailwind-merge/lucide-react/sonner/tw-animate-css/react-hook-form/@hookform/resolvers)；`lib/utils.ts`；重写 globals.css 纸感令牌；layout 加载衬线字体 + `<Toaster/>`；回归 6 页无破坏 |
| 1 组件库 | 从 coze 复制 + 纸感主题化 | P0/P1/P2 组件；对齐现有 4 组件到 cva+cn |
| 2 现有页重绘 | 6 页迁移新视觉 | 应用壳；首页 7 区块；login/register/profile/settings/admin verify 重绘 |
| 3 物品+订单+通知(P1) | 后端模型 + 页面 | Item/Favorite/WaitingList/Match/Notification 模型与 actions；/items*、/me/items、/notifications |
| 4 服务/需求(P2) | 后端模型 + 页面 | Service/Need/Booking 模型与 actions；/services*、/needs*、/me/bookings、/me/matches |
| 5 评价/举报/后台(P3)+打磨 | 横切 + 后台 | Review/Report/Violation；评价弹窗、举报弹窗、/admin 扩展；暗色决策落地、对比度审计、响应式回归 |

---

## 6. 验证（每阶段）

`pnpm typecheck` + `pnpm lint` + `pnpm test` + `DATABASE_URL=… pnpm build`（Prisma 7 需前缀）；数据层/端到端浏览器冒烟（本地 Docker Postgres）。R2 相关（真实上传/私有读取）仍需用户填凭证后验证。

---

## 7. 风险

- 依赖根基为零（无 cva/clsx/tailwind-merge/lucide/sonner）→ Phase 0 先装 + 建 cn，再迁移现有 4 组件，避免丢业务映射（如 Badge 的 `VERIFICATION_STATUS`）。
- 令牌迁移同时影响所有页 → Phase 0 改完立即回归 6 页。
- 后端全未实现 → 与前端并行，先模型+actions 再接页面；未就绪字段用空态占位。
- 不建站内信/IM（PRD 约束）。
