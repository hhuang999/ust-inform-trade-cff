import Link from "next/link";
import { redirect } from "next/navigation";
import { HandHeart, Heart, PackageOpen, Wrench } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";
import { aggregateRatings, ratingNumber } from "@/lib/reputation";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { ItemCard } from "@/components/site/item-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
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
    redirect("/login?callbackUrl=/me/favorites");
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: viewerId },
    orderBy: { createdAt: "desc" },
    select: { targetType: true, targetId: true },
  });

  const itemIds = favorites
    .filter((f) => f.targetType === "ITEM")
    .map((f) => f.targetId);
  const serviceIds = favorites
    .filter((f) => f.targetType === "SERVICE")
    .map((f) => f.targetId);
  const needIds = favorites
    .filter((f) => f.targetType === "NEED")
    .map((f) => f.targetId);

  const [items, services, needs] = await Promise.all([
    prisma.item.findMany({
      where: { id: { in: itemIds }, deletedAt: null, status: { not: "CLOSED" } },
      include: { seller: { select: { id: true, nickname: true } } },
    }),
    prisma.service.findMany({
      where: { id: { in: serviceIds }, deletedAt: null, status: { not: "CLOSED" } },
      include: { provider: { select: { id: true, nickname: true } } },
    }),
    prisma.need.findMany({
      where: { id: { in: needIds }, deletedAt: null, status: { not: "CLOSED" } },
      include: { requester: { select: { id: true, nickname: true } } },
    }),
  ]);

  // 按收藏顺序排列(已被删除/关闭的条目自动消失,不报错)。
  const orderedItems = itemIds.flatMap((id) => {
    const it = items.find((x) => x.id === id);
    return it ? [it] : [];
  });
  const orderedServices = serviceIds.flatMap((id) => {
    const s = services.find((x) => x.id === id);
    return s ? [s] : [];
  });
  const orderedNeeds = needIds.flatMap((id) => {
    const n = needs.find((x) => x.id === id);
    return n ? [n] : [];
  });

  const itemSellerRatings = await aggregateRatings(
    orderedItems.map((i) => i.sellerId),
    "ITEM",
  );

  const isEmpty =
    orderedItems.length === 0 &&
    orderedServices.length === 0 &&
    orderedNeeds.length === 0;

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="我的收藏"
        description="你收藏的物品、服务与需求,方便稍后再看"
      />

      {isEmpty ? (
        <Empty className="min-h-[320px] border bg-card/40">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Heart />
            </EmptyMedia>
            <EmptyTitle>还没有收藏</EmptyTitle>
            <EmptyDescription>
              在物品 / 服务 / 需求详情页点击标题旁的心形即可收藏
            </EmptyDescription>
          </EmptyHeader>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/items">逛物品</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/services">逛服务</Link>
            </Button>
          </div>
        </Empty>
      ) : null}

      {/* ── 物品 ── */}
      {orderedItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
            <PackageOpen className="size-4 text-primary" />
            物品
            <Badge variant="secondary" className="font-normal">
              {orderedItems.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {orderedItems.map((it) => (
              <ItemCard
                key={it.id}
                id={it.id}
                title={it.title}
                priceMode={it.priceMode}
                price={it.price}
                firstImageKey={it.imageKeys[0] ?? null}
                category={it.category}
                condition={it.condition}
                sellerNickname={it.seller.nickname}
                sellerRating={ratingNumber(itemSellerRatings, it.sellerId)}
                status={it.status}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 服务 ── */}
      {orderedServices.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Wrench className="size-4 text-primary" />
            服务
            <Badge variant="secondary" className="font-normal">
              {orderedServices.length}
            </Badge>
          </h2>
          <div className="space-y-3">
            {orderedServices.map((s) => (
              <Link key={s.id} href={`/services/${s.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 font-serif text-base font-semibold">
                        {s.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        提供者:{s.provider.nickname} ·{" "}
                        {s.categories.join(" / ") || "未分类"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === "PAUSED" ? (
                        <Badge variant="secondary" className="bg-warning/90 text-white">
                          已暂停
                        </Badge>
                      ) : null}
                      <span className="font-serif font-semibold tabular-nums text-primary">
                        {s.price}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 需求 ── */}
      {orderedNeeds.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
            <HandHeart className="size-4 text-primary" />
            需求
            <Badge variant="secondary" className="font-normal">
              {orderedNeeds.length}
            </Badge>
          </h2>
          <div className="space-y-3">
            {orderedNeeds.map((n) => (
              <Link key={n.id} href={`/needs/${n.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="line-clamp-1 font-serif text-base font-semibold">
                        {n.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        发布者:{n.requester.nickname} · {n.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {n.status === "PAUSED" ? (
                        <Badge variant="secondary" className="bg-warning/90 text-white">
                          已暂停
                        </Badge>
                      ) : null}
                      <span className="font-serif font-semibold tabular-nums text-primary">
                        {n.reward}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
