import Link from "next/link";
import {
  ArrowRight,
  HandHeart,
  PackageOpen,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SiteHeader } from "@/components/layout/site-header";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { ItemCard } from "@/components/site/item-card";

export const dynamic = "force-dynamic";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "真实身份认证",
    body: "学籍核验 + 实名背书，让每一次交易都有据可依、安心可靠。",
  },
  {
    icon: Sparkles,
    title: "安全撮合",
    body: "物品、服务、需求分类聚合，消息留痕，撮合过程清晰可追踪。",
  },
  {
    icon: HandHeart,
    title: "校内互助",
    body: "连接同学，让闲置流转，让技能变现，共建温暖的校园社区。",
  },
] as const;

const ANIM = "animate-in fade-in slide-in-from-bottom-4 duration-500";

export default async function Home() {
  const session = await auth();
  const headerUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
      }
    : null;

  // 个人化问候:JWT 不带 nickname,已登录时从 DB 取昵称。
  let nickname: string | null = null;
  if (session?.user?.id) {
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { nickname: true },
    });
    nickname = me?.nickname ?? null;
  }

  // 首页统计与最新物品:廉价 count / limit 查询,DB 空时安全降级。
  const [availableItems, verifiedUsers, latestItems] = await Promise.all([
    prisma.item.count({ where: { status: "AVAILABLE" } }),
    prisma.user.count({
      where: { verificationStatus: "VERIFIED", deletedAt: null },
    }),
    prisma.item.findMany({
      where: { status: "AVAILABLE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { seller: { select: { nickname: true } } },
    }),
  ]);

  const stats = [
    { label: "在售物品", value: availableItems },
    { label: "认证用户", value: verifiedUsers },
    { label: "校内互助", value: "温暖" },
    { label: "安全撮合", value: "安心" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={headerUser} />
      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="bg-gradient-to-b from-primary-container/40 via-primary-container/15 to-transparent">
          <PageContainer className="flex flex-col items-center gap-6 py-20 text-center md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              港科大（广州）校园社区
            </span>

            <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
              {nickname ? `欢迎回来，${nickname}` : "校园枢纽"}
            </h1>
            <p className="text-sm font-medium uppercase tracking-widest text-primary/80">
              港科大（广州）
            </p>

            <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
              校园二手物品与咨询服务撮合平台。
              连接同学，让闲置流转，让技能变现。
            </p>

            <div className="mt-2 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
              <Button asChild size="lg" className={ANIM}>
                <Link href="/items">
                  浏览物品
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className={ANIM}>
                <Link href="/register">加入社区</Link>
              </Button>
            </div>
          </PageContainer>
        </section>

        {/* ── Stats strip ── */}
        <PageContainer className="py-6">
          <div
            className={`grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 ${ANIM}`}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-outline-variant/40 bg-card px-4 py-5 text-center shadow-card"
              >
                <div className="font-serif text-2xl font-bold tabular-nums text-primary md:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-muted-foreground md:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </PageContainer>

        {/* ── 最新物品 ── */}
        <PageContainer className="space-y-5 py-10">
          <SectionHeading
            title="最新物品"
            description="校园里刚刚上架的闲置好物"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/items">
                  查看全部
                  <ArrowRight />
                </Link>
              </Button>
            }
          />

          {latestItems.length === 0 ? (
            <Empty className="min-h-[240px] border bg-card/40">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageOpen />
                </EmptyMedia>
                <EmptyTitle>暂无在售物品</EmptyTitle>
                <EmptyDescription>
                  校园里还没有物品上架。
                  <Link href="/items/new" className="ml-1">
                    成为第一个发布者
                  </Link>
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div
              className={`grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 ${ANIM}`}
            >
              {latestItems.map((item) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  priceMode={item.priceMode}
                  price={item.price}
                  firstImageKey={item.imageKeys[0] ?? null}
                  category={item.category}
                  condition={item.condition}
                  sellerNickname={item.seller.nickname}
                  sellerRating={undefined}
                  status={item.status}
                  createdAt={item.createdAt}
                />
              ))}
            </div>
          )}
        </PageContainer>

        {/* ── 服务/需求广场(Phase 4 占位) ── */}
        <PageContainer className="py-6">
          <Card
            className={`flex flex-col items-center gap-3 border-dashed bg-card/60 px-6 py-10 text-center ${ANIM}`}
          >
            <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-serif text-lg font-semibold">
                服务与需求广场即将上线
              </h3>
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                咨询服务预约与需求应征撮合正在打磨中，敬请期待。
              </p>
            </div>
            <Button variant="outline" disabled>
              敬请期待
            </Button>
          </Card>
        </PageContainer>

        {/* ── Feature cards ── */}
        <PageContainer className="py-10">
          <div className="grid gap-5 sm:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className={`items-start ${ANIM}`}
                  // 错峰入场
                  style={{ animationDelay: `${i * 75}ms` }}
                >
                  <CardHeader>
                    <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <CardTitle className="font-serif text-lg">
                      {f.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {f.body}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </PageContainer>

        {/* Footer line */}
        <PageContainer className="py-10">
          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} 校园枢纽 · 港科大（广州）· 校内互助，让信息流转
          </p>
        </PageContainer>
      </main>
    </div>
  );
}
