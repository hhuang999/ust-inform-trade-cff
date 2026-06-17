import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  PackageOpen,
  Pencil,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { aggregateRatings, ratingNumber } from "@/lib/reputation";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { ItemCard } from "@/components/site/item-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { OrderActions } from "./order-actions";
import { SellingItemActions } from "./selling-actions";

export const dynamic = "force-dynamic";

type Tab = "selling" | "wanted" | "deals";

const TABS: { value: Tab; label: string }[] = [
  { value: "selling", label: "我发布的" },
  { value: "wanted", label: "我想要的" },
  { value: "deals", label: "交易中" },
];

/** 物品状态徽章(我发布的 tab)。 */
function SellingStatusBadge({ status }: { status: "AVAILABLE" | "PENDING" | "SOLD" | "CLOSED" }) {
  switch (status) {
    case "AVAILABLE":
      return (
        <Badge variant="outline" className="font-normal">
          在售
        </Badge>
      );
    case "PENDING":
      return (
        <Badge variant="secondary" className="bg-warning/90 text-white">
          交易中
        </Badge>
      );
    case "SOLD":
      return (
        <Badge variant="success" className="font-normal">
          已售出
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          已关闭
        </Badge>
      );
  }
}

/** 把 imageKey 解析为 R2 公开 URL;缺失时返回 null。 */
function publicUrl(imageKey?: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!imageKey || !base) return null;
  return `${base.replace(/\/$/, "")}/${imageKey}`;
}

export default async function MyItemsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // (app) 布局已 auth-gate;此处取 session 用户。若异常,交给上层重定向。
  const session = await auth();
  let viewerId: string;
  try {
    viewerId = requireVerifiedUser(
      session?.user
        ? {
            id: session.user.id,
            role: session.user.role,
            verificationStatus: session.user.verificationStatus,
          }
        : null
    ).id;
  } catch {
    redirect("/login");
  }

  const sp = await searchParams;
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "selling";
  const tab: Tab = TABS.some((t) => t.value === tabRaw) ? (tabRaw as Tab) : "selling";

  // ── 并行查询三个数据源 ──
  const [sellingItems, wantedInterests, deals, dealsReviewed] = await Promise.all([
    // 我发布的:我的物品 + 意向人数 + 当前交易状态。
    prisma.item.findMany({
      where: { sellerId: viewerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { interests: true } },
        deal: { select: { status: true } },
      },
    }),
    // 我想要的:我的意向 + 物品(仅 AVAILABLE/PENDING,或自己拥有)。
    prisma.itemInterest.findMany({
      where: { userId: viewerId },
      orderBy: { createdAt: "desc" },
      include: {
        item: {
          include: {
            seller: { select: { id: true, nickname: true } },
          },
        },
      },
    }),
    // 交易中:我参与的交易 + 物品 + 对方。
    prisma.itemDeal.findMany({
      where: {
        OR: [{ sellerId: viewerId }, { buyerId: viewerId }],
        status: { in: ["PENDING", "COMPLETED", "CANCELLED"] },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        item: { select: { id: true, title: true, priceMode: true, price: true, status: true } },
        seller: { select: { id: true, nickname: true } },
        buyer: { select: { id: true, nickname: true } },
      },
    }),
    // 我作为评价人已提交的物品交易评价(用于设置 hasReviewed)。
    prisma.review.findMany({
      where: { reviewerId: viewerId, dealType: "ITEM" },
      select: { dealId: true },
    }),
  ]);

  const reviewedDealIds = new Set(dealsReviewed.map((r) => r.dealId));

  // 我想要的:过滤掉已售出/关闭(除非是自己拥有的物品)。
  const wantedList = wantedInterests.filter((it) => {
    if (it.item.deletedAt) return false;
    return (
      it.item.status === "AVAILABLE" ||
      it.item.status === "PENDING" ||
      it.item.seller.id === viewerId
    );
  });

  // 我想要列表里各卖家的物品交易评分(信誉标签,§3.7)。
  const wantedSellerRatings = await aggregateRatings(
    wantedList.map((it) => it.item.sellerId),
    "ITEM",
  );

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="我的交易"
        description="管理你发布的物品、关注的意向与进行中的交易"
      />

      {/* ── Tab 切换(server Link tabs,同 items 列表风格) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Link key={t.value} href={`/me/items?tab=${t.value}`}>
              <Badge
                variant={active ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1 text-sm",
                  active && "bg-primary text-primary-foreground"
                )}
              >
                {t.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* ── 我发布的 ── */}
      {tab === "selling" ? (
        sellingItems.length === 0 ? (
          <Empty className="min-h-[320px] border bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Store />
              </EmptyMedia>
              <EmptyTitle>还没有发布物品</EmptyTitle>
              <EmptyDescription>把闲置好物发出来,让它在校园里流转起来</EmptyDescription>
            </EmptyHeader>
            <Button asChild>
              <Link href="/items/new">发布物品</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {sellingItems.map((item) => {
              const isAvailable = item.status === "AVAILABLE";
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="flex items-center gap-4 p-3">
                    <Link
                      href={`/items/${item.id}`}
                      className="group flex min-w-0 flex-1 items-center gap-4"
                    >
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-accent">
                        {publicUrl(item.imageKeys[0]) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={publicUrl(item.imageKeys[0]) ?? undefined}
                            alt={item.title}
                            loading="lazy"
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <PackageOpen className="size-5 opacity-60" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="line-clamp-1 font-serif text-base font-semibold">
                            {item.title}
                          </h3>
                          <SellingStatusBadge status={item.status} />
                        </div>
                        <p className="mt-0.5 font-serif text-sm tabular-nums text-primary">
                          {renderPrice(item.priceMode, item.price)}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <ShoppingBag className="size-3.5" />
                            意向 {item._count.interests} 人
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* 动作区 */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {isAvailable ? (
                        <>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/items/${item.id}/edit`}>
                              <Pencil />
                              编辑
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                            <Link href={`/items/${item.id}`}>
                              管理
                              <ChevronRight />
                            </Link>
                          </Button>
                        </>
                      ) : item.status === "PENDING" ? (
                        <Button asChild size="sm">
                          <Link href={`/items/${item.id}`}>
                            交易中
                            <ChevronRight />
                          </Link>
                        </Button>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
                            <Link href={`/items/${item.id}`}>
                              查看
                              <ChevronRight />
                            </Link>
                          </Button>
                          <SellingItemActions itemId={item.id} status={item.status} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {/* ── 我想要的 ── */}
      {tab === "wanted" ? (
        wantedList.length === 0 ? (
          <Empty className="min-h-[320px] border bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBag />
              </EmptyMedia>
              <EmptyTitle>还没有表达过意向</EmptyTitle>
              <EmptyDescription>逛逛二手物品,对心仪的好物点击「我想要」</EmptyDescription>
            </EmptyHeader>
            <Button asChild variant="outline">
              <Link href="/items">去逛逛</Link>
            </Button>
          </Empty>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {wantedList.map((it) => (
              <ItemCard
                key={it.id}
                id={it.item.id}
                title={it.item.title}
                priceMode={it.item.priceMode}
                price={it.item.price}
                firstImageKey={it.item.imageKeys[0] ?? null}
                category={it.item.category}
                condition={it.item.condition}
                sellerNickname={it.item.seller.nickname}
                sellerRating={ratingNumber(wantedSellerRatings, it.item.sellerId)}
                status={it.item.status}
                createdAt={it.item.createdAt}
              />
            ))}
          </div>
        )
      ) : null}

      {/* ── 交易中 ── */}
      {tab === "deals" ? (
        deals.length === 0 ? (
          <Empty className="min-h-[320px] border bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CheckCircle2 />
              </EmptyMedia>
              <EmptyTitle>还没有交易记录</EmptyTitle>
              <EmptyDescription>当卖家选定买家后,交易会出现在这里</EmptyDescription>
            </EmptyHeader>
            <Button asChild variant="outline">
              <Link href="/items">去逛逛</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const isSeller = deal.sellerId === viewerId;
              const counterparty = isSeller ? deal.buyer : deal.seller;
              return (
                <Card key={deal.id}>
                  <CardContent className="space-y-3 p-4">
                    {/* 物品标题 + 角色 */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/items/${deal.item.id}`}
                          className="font-serif text-base font-semibold transition-colors hover:text-primary"
                        >
                          {deal.item.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isSeller ? "你是卖方" : "你是买方"} ·{" "}
                          <span className="text-foreground/80">
                            {counterparty.nickname}
                          </span>
                        </p>
                      </div>
                      <Badge
                        variant={isSeller ? "default" : "secondary"}
                        className="font-normal"
                      >
                        {isSeller ? "卖方" : "买方"}
                      </Badge>
                    </div>

                    {/* 状态时间线 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DealTimeline
                        status={deal.status}
                        firstConfirmerId={deal.firstConfirmerId}
                        viewerId={viewerId}
                        createdAt={deal.createdAt}
                        completedAt={deal.completedAt}
                      />
                    </div>

                    {/* 动作区 */}
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/40 pt-3">
                      <OrderActions
                        dealId={deal.id}
                        itemId={deal.item.id}
                        isSeller={isSeller}
                        status={deal.status}
                        firstConfirmerId={deal.firstConfirmerId}
                        viewerId={viewerId}
                        completedAt={deal.completedAt?.toISOString() ?? null}
                        counterpartyNickname={counterparty.nickname}
                        hasReviewed={reviewedDealIds.has(deal.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : null}
    </PageContainer>
  );
}

/** 渲染价格:免费 / 面议 / ¥金额。 */
function renderPrice(
  priceMode: "SPECIFIC" | "FREE" | "NEGOTIABLE",
  price?: number | null
): string {
  if (priceMode === "FREE") return "免费";
  if (priceMode === "NEGOTIABLE") return "面议";
  if (typeof price === "number") return `¥${price.toLocaleString("zh-CN")}`;
  return "面议";
}

/** 交易状态时间线(创建 → 确认 → 完成/取消)。 */
function DealTimeline({
  status,
  firstConfirmerId,
  viewerId,
  createdAt,
  completedAt,
}: {
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  firstConfirmerId: string | null;
  viewerId: string;
  createdAt: Date;
  completedAt: Date | null;
}) {
  const created = formatDate(createdAt);
  const done = completedAt ? formatDate(completedAt) : null;

  if (status === "COMPLETED" && done) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="size-3.5 text-verified" />
        {created} 创建 · {done} 完成
      </span>
    );
  }
  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <XCircle className="size-3.5 text-muted-foreground" />
        {created} 创建 · 已取消
      </span>
    );
  }
  const youConfirmed = firstConfirmerId === viewerId;
  const confirmText = youConfirmed
    ? "你已确认,等待对方"
    : firstConfirmerId
      ? "对方已确认,等你确认"
      : "等待双方确认完成";
  return (
    <span className="inline-flex items-center gap-1.5">
      <CheckCircle2 className="size-3.5 text-warning" />
      {created} 创建 · {confirmText}
    </span>
  );
}

/** 格式化日期为 YYYY-MM-DD。 */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
