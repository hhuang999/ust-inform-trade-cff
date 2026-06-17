import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ShieldAlert, Star, Package, Wrench, Search } from "lucide-react";

import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge, type VerificationStatus } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const ANIM = "animate-in fade-in slide-in-from-bottom-4 duration-500";

/** Mask the student id, showing only the trailing segment. */
function maskStudentId(sid: string): string {
  if (sid.length <= 4) return sid;
  return "•".repeat(sid.length - 4) + sid.slice(-4);
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      nickname: true,
      avatarKey: true,
      department: true,
      enrollmentYear: true,
      realName: true,
      realNameVisible: true,
      studentId: true,
      verificationStatus: true,
      violationCount: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  // 信誉聚合:仅统计已公开(revealed=true)且收方为本人的评价。
  const [itemAgg, serviceAgg, recentReviews, historyItems, historyServices, historyNeeds] = await Promise.all([
    prisma.review.aggregate({
      where: { revieweeId: id, revealed: true, dealType: "ITEM" },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.aggregate({
      where: {
        revieweeId: id,
        revealed: true,
        dealType: { in: ["BOOKING", "NEED_MATCH"] },
      },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { revieweeId: id, revealed: true },
      orderBy: { revealedAt: "desc" },
      take: 5,
      select: {
        id: true,
        dealType: true,
        rating: true,
        content: true,
        reviewer: { select: { nickname: true } },
      },
    }),
    // 发布历史(PRD §2.5):排除软删除。
    prisma.item.findMany({
      where: { sellerId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, priceMode: true, price: true },
    }),
    prisma.service.findMany({
      where: { providerId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, price: true },
    }),
    prisma.need.findMany({
      where: { requesterId: id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, title: true, status: true },
    }),
  ]);

  const itemAvg = itemAgg._avg.rating;
  const itemCount = itemAgg._count._all;
  const serviceAvg = serviceAgg._avg.rating;
  const serviceCount = serviceAgg._count._all;
  const totalReviews = itemCount + serviceCount;
  // 综合信誉:所有已公开评价的加权平均。
  const overallAvg =
    totalReviews > 0
      ? ((itemAvg ?? 0) * itemCount + (serviceAvg ?? 0) * serviceCount) /
        totalReviews
      : null;

  const avatarUrl = user.avatarKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${user.avatarKey}`
    : null;
  const initial = (user.nickname ?? "?").charAt(0).toUpperCase();

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        {/* Header card */}
        <Card className={ANIM}>
          <CardContent className="p-6">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="size-20 ring-2 ring-primary/30">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={user.nickname ?? "头像"} />
                ) : null}
                <AvatarFallback className="bg-primary-container font-serif text-2xl font-semibold text-primary">
                  {initial}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl font-bold tracking-tight">
                    {user.nickname}
                  </h1>
                  <Badge
                    status={
                      user.verificationStatus as VerificationStatus
                    }
                  />
                </div>

                <p className="text-sm text-muted-foreground">
                  {user.department} · {user.enrollmentYear} 级
                </p>

                {user.realNameVisible && user.realName ? (
                  <p className="text-sm text-muted-foreground">
                    真实姓名：
                    <span className="text-foreground">{user.realName}</span>
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Badge
                    variant={user.violationCount > 0 ? "destructive" : "secondary"}
                    className={cn(
                      "font-normal",
                      user.violationCount === 0
                        ? "text-muted-foreground"
                        : null,
                    )}
                  >
                    <ShieldAlert className="size-3.5" />
                    违规 {user.violationCount}
                  </Badge>
                </div>
              </div>
            </header>
          </CardContent>
        </Card>

        {/* Stats row */}
        <Card className={ANIM}>
          <CardContent className="p-0">
            <div className="grid grid-cols-3 divide-x divide-outline-variant/40">
              <StatCell
                label="信誉"
                value={
                  overallAvg != null
                    ? `${overallAvg.toFixed(1)} 分`
                    : "暂无"
                }
                numeric
              />
              <StatCell label="评价数" value={totalReviews} numeric />
              <StatCell label="违规" value={user.violationCount} numeric />
            </div>
          </CardContent>
        </Card>

        {/* Two-column area */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 信誉与评价 */}
          <Card className={ANIM}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="size-4 text-primary" />
                信誉与评价
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 py-2">
              <ReputationRow
                label="物品交易信誉"
                avg={itemAvg}
                count={itemCount}
              />
              <ReputationRow
                label="服务交易信誉"
                avg={serviceAvg}
                count={serviceCount}
              />

              {recentReviews.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {recentReviews.map((r) => (
                    <ReviewItem
                      key={r.id}
                      rating={r.rating}
                      content={r.content}
                      reviewerNickname={r.reviewer?.nickname}
                      dealTypeLabel={
                        r.dealType === "ITEM"
                          ? "物品"
                          : r.dealType === "BOOKING"
                            ? "服务"
                            : "需求"
                      }
                    />
                  ))}
                </div>
              ) : (
                <Empty className="border-transparent p-0">
                  <EmptyTitle className="text-sm">暂无评价</EmptyTitle>
                  <EmptyDescription>
                    完成交易后，双方可互相评价。
                  </EmptyDescription>
                </Empty>
              )}
            </CardContent>
          </Card>

          {/* 基本信息 */}
          <Card className={ANIM}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 py-2">
              <InfoRow label="院系" value={user.department} />
              <Separator />
              <InfoRow label="入学年份" value={`${user.enrollmentYear} 级`} />
              <Separator />
              <InfoRow
                label="学号"
                value={maskStudentId(user.studentId)}
              />
              <Separator />
              <InfoRow
                label="加入时间"
                value={formatDate(user.createdAt)}
              />
            </CardContent>
          </Card>
        </div>

        {/* History tabs */}
        <Card className={ANIM}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">发布历史</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items" className="gap-1.5">
                  <Package className="size-3.5" />
                  物品
                </TabsTrigger>
                <TabsTrigger value="services" className="gap-1.5">
                  <Wrench className="size-3.5" />
                  服务
                </TabsTrigger>
                <TabsTrigger value="needs" className="gap-1.5">
                  <Search className="size-3.5" />
                  需求
                </TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-3">
                <HistoryList
                  rows={historyItems.map((i) => ({
                    href: `/items/${i.id}`,
                    title: i.title,
                    meta: renderPrice(i.priceMode, i.price),
                  }))}
                  emptyIcon={<Package className="size-6" />}
                  emptyHint="暂无发布的物品"
                />
              </TabsContent>
              <TabsContent value="services" className="mt-3">
                <HistoryList
                  rows={historyServices.map((s) => ({
                    href: `/services/${s.id}`,
                    title: s.title,
                    meta: s.price,
                  }))}
                  emptyIcon={<Wrench className="size-6" />}
                  emptyHint="暂无发布的服务"
                />
              </TabsContent>
              <TabsContent value="needs" className="mt-3">
                <HistoryList
                  rows={historyNeeds.map((n) => ({
                    href: `/needs/${n.id}`,
                    title: n.title,
                    meta:
                      n.status === "OPEN"
                        ? "开放中"
                        : n.status === "PAUSED"
                          ? "已暂停"
                          : "已关闭",
                  }))}
                  emptyIcon={<Search className="size-6" />}
                  emptyHint="暂无发布的求购"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

/** A single stat cell inside the divided stats row. */
function StatCell({
  label,
  value,
  numeric = false,
}: {
  label: string;
  value: string | number;
  numeric?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-4">
      <span
        className={cn(
          "text-foreground",
          numeric
            ? "font-serif text-xl font-bold tabular-nums"
            : "font-serif text-lg font-semibold",
        )}
      >
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/** 信誉汇总行:评分 + 条数 + 星级可视化。 */
function ReputationRow({
  label,
  avg,
  count,
}: {
  label: string;
  avg: number | null;
  count: number;
}) {
  const has = count > 0 && avg != null;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {has ? (
          <>
            <span className="inline-flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "size-3.5",
                    s <= Math.round(avg)
                      ? "fill-warning text-warning"
                      : "fill-transparent text-muted-foreground/30"
                  )}
                />
              ))}
            </span>
            <span className="font-serif tabular-nums font-semibold text-foreground">
              {avg.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              ({count})
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">暂无评价</span>
        )}
      </div>
    </div>
  );
}

/** 单条已公开评价(星级 + 评价人 + 内容)。 */
function ReviewItem({
  rating,
  content,
  reviewerNickname,
  dealTypeLabel,
}: {
  rating: number;
  content: string | null;
  reviewerNickname?: string;
  dealTypeLabel: string;
}) {
  return (
    <div className="rounded-lg bg-accent/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "size-3.5",
                s <= rating
                  ? "fill-warning text-warning"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          ))}
        </span>
        <span className="text-xs text-muted-foreground">
          {reviewerNickname ?? "匿名用户"} · {dealTypeLabel}
        </span>
      </div>
      {content ? (
        <p className="mt-1.5 text-sm text-foreground/80">{content}</p>
      ) : null}
    </div>
  );
}

/** A labeled info row used in 基本信息. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right text-foreground">{value}</span>
    </div>
  );
}

interface HistoryRow {
  href: string;
  title: string;
  meta: string;
}

/** 发布历史列表(每个 tab 一组;空态走 Empty)。 */
function HistoryList({
  rows,
  emptyIcon,
  emptyHint,
}: {
  rows: HistoryRow[];
  emptyIcon: ReactNode;
  emptyHint: string;
}) {
  if (rows.length === 0) {
    return (
      <Empty className="border-dashed py-8">
        <EmptyMedia variant="icon">{emptyIcon}</EmptyMedia>
        <EmptyTitle className="text-sm">{emptyHint}</EmptyTitle>
        <EmptyDescription>该用户暂未发布相关内容。</EmptyDescription>
      </Empty>
    );
  }
  return (
    <ul className="divide-y divide-outline-variant/40">
      {rows.map((r) => (
        <li key={r.href}>
          <Link
            href={r.href}
            className="flex items-center justify-between gap-3 py-2.5 text-sm transition-colors hover:text-primary"
          >
            <span className="min-w-0 truncate font-medium">{r.title}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {r.meta}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 价格文案:免费 / 面议 / ¥金额。 */
function renderPrice(
  priceMode: "SPECIFIC" | "FREE" | "NEGOTIABLE",
  price?: number | null,
): string {
  if (priceMode === "FREE") return "免费";
  if (priceMode === "NEGOTIABLE") return "面议";
  if (typeof price === "number") return `¥${price.toLocaleString("zh-CN")}`;
  return "面议";
}

function formatDate(d: Date): string {
  // Locale-independent, deterministic formatting for SSR stability.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
