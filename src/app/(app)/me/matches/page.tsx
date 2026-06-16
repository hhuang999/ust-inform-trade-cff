import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Handshake,
  Megaphone,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
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
import { Button } from "@/components/ui/button";

import { MatchActions } from "./match-actions";

export const dynamic = "force-dynamic";

type Tab = "incoming" | "outgoing";

const TABS: { value: Tab; label: string }[] = [
  { value: "incoming", label: "我的应征" },
  { value: "outgoing", label: "我的需求匹配" },
];

type MatchStatus =
  | "APPLIED"
  | "MATCHED"
  | "CANCELLING"
  | "COMPLETED"
  | "CANCELLED"
  | "NOT_SELECTED";

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

export default async function MyMatchesPage({
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
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "incoming";
  const tab: Tab = TABS.some((t) => t.value === tabRaw)
    ? (tabRaw as Tab)
    : "incoming";

  // 拉取我作为提供者或发布者参与的应征/匹配。
  const matches = await prisma.needMatch.findMany({
    where: {
      OR: [{ providerId: viewerId }, { need: { requesterId: viewerId } }],
      status: {
        in: ["APPLIED", "MATCHED", "CANCELLING", "COMPLETED", "CANCELLED", "NOT_SELECTED"],
      },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      need: {
        select: { id: true, title: true, requesterId: true, requester: { select: { nickname: true } } },
      },
      provider: { select: { id: true, nickname: true } },
    },
  });

  // 我已评价的对接(用于设置 hasReviewed)。
  const matchesReviewed = await prisma.review.findMany({
    where: { reviewerId: viewerId, dealType: "NEED_MATCH" },
    select: { dealId: true },
  });
  const reviewedMatchIds = new Set(matchesReviewed.map((r) => r.dealId));

  // 过滤当前 tab:incoming = 我是提供者;outgoing = 我是发布者(需求方)。
  const list = matches.filter((m) =>
    tab === "incoming"
      ? m.providerId === viewerId
      : m.need.requesterId === viewerId
  );

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="需求匹配"
        description="管理你的应征与你发布需求的撮合"
      />

      {/* ── Tab 切换(server Link tabs) ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = t.value === tab;
          return (
            <Link key={t.value} href={`/me/matches?tab=${t.value}`}>
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

      {list.length === 0 ? (
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
          {list.map((m) => {
            const isProvider = m.providerId === viewerId;
            const role: "provider" | "requester" = isProvider
              ? "provider"
              : "requester";
            const counterparty = isProvider
              ? m.need.title
              : m.provider.nickname;
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
      )}
    </PageContainer>
  );
}
