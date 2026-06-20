import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  HandHeart,
  Handshake,
  Megaphone,
  Pencil,
  Plus,
  Users,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MatchActions } from "@/app/(app)/me/matches/match-actions";

export const dynamic = "force-dynamic";

type Tab = "published" | "outgoing" | "incoming";

const TABS: { value: Tab; label: string }[] = [
  { value: "published", label: "我发布的需求" },
  { value: "outgoing", label: "我的需求匹配" },
  { value: "incoming", label: "我的应征" },
];

type NeedStatus = "OPEN" | "PAUSED" | "CLOSED";
type MatchStatus =
  | "APPLIED"
  | "MATCHED"
  | "CANCELLING"
  | "COMPLETED"
  | "CANCELLED"
  | "NOT_SELECTED";

const EXPECTED_TIME_LABEL: Record<string, string> = {
  ASAP: "尽快",
  THIS_WEEK: "本周内",
  TWO_WEEKS: "两周内",
  FLEXIBLE: "时间灵活",
};

/** 需求状态徽标(我发布的需求)。 */
function NeedStatusBadge({ status }: { status: NeedStatus }) {
  switch (status) {
    case "OPEN":
      return (
        <Badge variant="outline" className="font-normal">
          开放中
        </Badge>
      );
    case "PAUSED":
      return (
        <Badge variant="secondary" className="bg-warning/90 text-white">
          已暂停
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

/** 应征/匹配状态徽章(列表行内次要展示)。 */
function MatchStatusBadge({ status }: { status: MatchStatus }) {
  switch (status) {
    case "APPLIED":
      return (
        <Badge variant="outline" className="font-normal">
          应征中
        </Badge>
      );
    case "MATCHED":
      return (
        <Badge variant="secondary" className="font-normal">
          已撮合
        </Badge>
      );
    case "CANCELLING":
      return (
        <Badge variant="secondary" className="bg-warning/90 text-white">
          取消协商中
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge variant="success" className="font-normal">
          已完成
        </Badge>
      );
    case "NOT_SELECTED":
      return (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          未被选中
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          已取消
        </Badge>
      );
  }
}

export default async function MyNeedsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "published";
  const tab: Tab = TABS.some((t) => t.value === tabRaw)
    ? (tabRaw as Tab)
    : "published";

  // 三个数据源并行:「我发布的需求」+ 我参与的撮合 + 我已评价的对接。
  const [needs, matches, matchesReviewed] = await Promise.all([
    prisma.need.findMany({
      where: { requesterId: viewerId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            // 待处理应征人数(发布者最关心的待办)。
            matches: { where: { status: "APPLIED" } },
          },
        },
      },
    }),
    prisma.needMatch.findMany({
      where: {
        OR: [{ providerId: viewerId }, { need: { requesterId: viewerId } }],
        status: {
          in: ["APPLIED", "MATCHED", "CANCELLING", "COMPLETED", "CANCELLED", "NOT_SELECTED"],
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        need: {
          select: {
            id: true,
            title: true,
            requesterId: true,
            requester: { select: { nickname: true } },
          },
        },
        provider: { select: { id: true, nickname: true } },
      },
    }),
    prisma.review.findMany({
      where: { reviewerId: viewerId, dealType: "NEED_MATCH" },
      select: { dealId: true },
    }),
  ]);
  const reviewedMatchIds = new Set(matchesReviewed.map((r) => r.dealId));

  // 当前 tab 的撮合列表:outgoing = 我是需求方;incoming = 我是提供者。
  const matchList = matches.filter((m) =>
    tab === "outgoing"
      ? m.need.requesterId === viewerId
      : m.providerId === viewerId
  );

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="需求撮合"
        description="管理你发布的需求与全部应征、撮合"
        action={
          <Button asChild>
            <Link href="/needs/new">
              <Plus />
              发布需求
            </Link>
          </Button>
        }
      />

      {/* ── Tab 切换(server Link tabs) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Link key={t.value} href={`/me/needs?tab=${t.value}`}>
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

      {/* ── 我发布的需求 ── */}
      {tab === "published" ? (
        needs.length === 0 ? (
          <Empty className="min-h-[320px] border bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HandHeart />
              </EmptyMedia>
              <EmptyTitle>还没有发布需求</EmptyTitle>
              <EmptyDescription>说出你的需求,匹配合适的提供者</EmptyDescription>
            </EmptyHeader>
            <Button asChild>
              <Link href="/needs/new">发布需求</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {needs.map((need) => {
              const status = need.status as NeedStatus;
              const editable = status === "OPEN" || status === "PAUSED";
              return (
                <Card key={need.id} className="overflow-hidden">
                  <CardContent className="flex items-center gap-4 p-3">
                    <Link
                      href={`/needs/${need.id}`}
                      className="group flex min-w-0 flex-1 items-center gap-4"
                    >
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground">
                        <HandHeart className="size-6 opacity-60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="line-clamp-1 font-serif text-base font-semibold">
                            {need.title}
                          </h3>
                          <NeedStatusBadge status={status} />
                        </div>
                        <p className="mt-0.5 font-serif text-sm tabular-nums text-primary">
                          {need.reward}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>{need.category}</span>
                          <span>
                            {EXPECTED_TIME_LABEL[need.expectedTime] ?? need.expectedTime}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="size-3.5" />
                            应征 {need._count.matches}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* 动作区 */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {editable ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/needs/${need.id}/edit`}>
                            <Pencil />
                            编辑
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className={cn(status === "CLOSED" && "text-muted-foreground")}
                      >
                        <Link href={`/needs/${need.id}`}>
                          管理
                          <ChevronRight />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )
      ) : null}

      {/* ── 我的需求匹配 / 我的应征 ── */}
      {tab !== "published" ? (
        matchList.length === 0 ? (
          <Empty className="min-h-[320px] border bg-card/40">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                {tab === "incoming" ? <Megaphone /> : <Handshake />}
              </EmptyMedia>
              <EmptyTitle>
                {tab === "incoming" ? "还没有应征记录" : "还没有人应征你的需求"}
              </EmptyTitle>
              <EmptyDescription>
                {tab === "incoming"
                  ? "去需求市场看看,遇到合适的就应征吧"
                  : "保持需求开放,新的应征会出现在这里"}
              </EmptyDescription>
            </EmptyHeader>
            <Button asChild variant="outline">
              <Link href="/needs">去逛逛需求</Link>
            </Button>
          </Empty>
        ) : (
          <div className="space-y-3">
            {matchList.map((m) => {
              const isProvider = m.providerId === viewerId;
              const role: "provider" | "requester" = isProvider
                ? "provider"
                : "requester";
              const counterparty = isProvider ? m.need.title : m.provider.nickname;
              const status = m.status as MatchStatus;
              const isViewerFirstConfirmer =
                !!m.firstConfirmerId && m.firstConfirmerId === viewerId;
              const isCanceller =
                status === "CANCELLING" &&
                !!m.cancelledById &&
                m.cancelledById === viewerId;

              return (
                <Card key={m.id}>
                  <CardContent className="space-y-3 p-4">
                    {/* 需求标题 + 对方 + 角色 */}
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/needs/${m.need.id}`}
                            className="font-serif text-base font-semibold transition-colors hover:text-primary"
                          >
                            {m.need.title}
                          </Link>
                          <MatchStatusBadge status={status} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {isProvider ? "你是服务方" : "你是需求方"} ·{" "}
                          <span className="text-foreground/80">{counterparty}</span>
                        </p>
                      </div>
                      <Badge
                        variant={isProvider ? "default" : "secondary"}
                        className="font-normal"
                      >
                        {isProvider ? "服务方" : "需求方"}
                      </Badge>
                    </div>

                    {/* 应征留言 */}
                    {m.message ? (
                      <p className="rounded-md bg-accent/60 px-3 py-2 text-sm text-foreground/80">
                        {m.message}
                      </p>
                    ) : null}

                    {/* 动作区 */}
                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/40 pt-3">
                      <MatchActions
                        matchId={m.id}
                        role={role}
                        status={status}
                        isViewerFirstConfirmer={isViewerFirstConfirmer}
                        isCanceller={isCanceller}
                        hasFirstConfirmer={!!m.firstConfirmerId}
                        counterpartyNickname={
                          isProvider ? m.need.requester.nickname : m.provider.nickname
                        }
                        hasReviewed={reviewedMatchIds.has(m.id)}
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
