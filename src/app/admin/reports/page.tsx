import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import type { ReportAction, ReportTargetType } from "@prisma/client";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Flag, Clock, ExternalLink } from "lucide-react";

import { REPORT_REASONS } from "@/lib/constants/report";
import { formatDateTime } from "@/lib/time";
import { ResolveActions } from "./resolve-actions";

const TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  ITEM: "物品",
  SERVICE: "服务",
  NEED: "需求",
  USER: "用户",
};

const ACTION_LABEL: Record<ReportAction, string> = {
  NONE: "无违规",
  WARNING: "警告",
  TAKEDOWN: "强制下架",
  BAN: "封禁",
};

const ACTION_VARIANT: Record<ReportAction, "secondary" | "success" | "destructive"> = {
  NONE: "secondary",
  WARNING: "secondary",
  TAKEDOWN: "destructive",
  BAN: "destructive",
};

function reasonLabel(value: string): string {
  return REPORT_REASONS.find((r) => r.value === value)?.label ?? value;
}

function targetHref(targetType: ReportTargetType, targetId: string): string | null {
  switch (targetType) {
    case "ITEM":
      return `/items/${targetId}`;
    case "SERVICE":
      return `/services/${targetId}`;
    case "NEED":
      return `/needs/${targetId}`;
    case "USER":
      return `/profile/${targetId}`;
    default:
      return null;
  }
}

export default async function AdminReportsPage() {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) redirect("/");

  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      reporter: { select: { nickname: true } },
    },
  });

  // Resolve target display info (title + owner nickname) in a small per-type
  // switch query. Group targetIds by type to keep this cheap.
  const byType: Record<ReportTargetType, string[]> = {
    ITEM: [],
    SERVICE: [],
    NEED: [],
    USER: [],
  };
  for (const r of reports) {
    byType[r.targetType].push(r.targetId);
  }

  const [items, services, needs, users] = await Promise.all([
    byType.ITEM.length
      ? prisma.item.findMany({
          where: { id: { in: byType.ITEM } },
          select: { id: true, title: true, sellerId: true },
        })
      : Promise.resolve([]),
    byType.SERVICE.length
      ? prisma.service.findMany({
          where: { id: { in: byType.SERVICE } },
          select: { id: true, title: true, providerId: true },
        })
      : Promise.resolve([]),
    byType.NEED.length
      ? prisma.need.findMany({
          where: { id: { in: byType.NEED } },
          select: { id: true, title: true, requesterId: true },
        })
      : Promise.resolve([]),
    byType.USER.length
      ? prisma.user.findMany({
          where: { id: { in: byType.USER } },
          select: { id: true, nickname: true },
        })
      : Promise.resolve([]),
  ]);

  const ownerIds = new Set<string>([
    ...items.map((i) => i.sellerId),
    ...services.map((s) => s.providerId),
    ...needs.map((n) => n.requesterId),
  ]);
  const owners = ownerIds.size
    ? await prisma.user.findMany({
        where: { id: { in: [...ownerIds] } },
        select: { id: true, nickname: true },
      })
    : [];
  const ownerNick = new Map(owners.map((o) => [o.id, o.nickname]));

  const itemMap = new Map(items.map((i) => [i.id, { title: i.title, ownerId: i.sellerId }]));
  const serviceMap = new Map(
    services.map((s) => [s.id, { title: s.title, ownerId: s.providerId }])
  );
  const needMap = new Map(needs.map((n) => [n.id, { title: n.title, ownerId: n.requesterId }]));
  const userMap = new Map(users.map((u) => [u.id, u.nickname]));

  function targetDisplay(targetType: ReportTargetType, targetId: string) {
    if (targetType === "ITEM") return itemMap.get(targetId) ?? null;
    if (targetType === "SERVICE") return serviceMap.get(targetId) ?? null;
    if (targetType === "NEED") return needMap.get(targetId) ?? null;
    if (targetType === "USER") {
      const nick = userMap.get(targetId);
      return nick ? { title: nick, ownerId: null } : null;
    }
    return null;
  }

  const pending = reports.filter((r) => r.status === "PENDING");
  const resolved = reports.filter((r) => r.status === "RESOLVED");

  const resolvers = resolved.length
    ? await prisma.user.findMany({
        where: { id: { in: resolved.map((r) => r.resolverId).filter(Boolean) as string[] } },
        select: { id: true, nickname: true },
      })
    : [];
  const resolverNick = new Map(resolvers.map((u) => [u.id, u.nickname]));

  return (
    <PageContainer className="max-w-4xl space-y-8">
      <SectionHeading
        title="举报处理"
        description="核实用户举报,对违规内容作出处理决定。"
        action={
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            待处理 {pending.length}
          </Badge>
        }
      />

      {pending.length === 0 && resolved.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/40 bg-card shadow-card">
          <Empty className="py-16">
            <EmptyMedia variant="icon">
              <Flag />
            </EmptyMedia>
            <EmptyTitle className="font-serif">暂无待处理举报</EmptyTitle>
            <EmptyDescription>所有举报都已处理完毕,稍后再来看看。</EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="space-y-5">
              {pending.map((r) => {
                const tt = r.targetType as ReportTargetType;
                const target = targetDisplay(tt, r.targetId);
                const ownerNickname = target?.ownerId
                  ? ownerNick.get(target.ownerId) ?? null
                  : null;
                const href = targetHref(tt, r.targetId);
                return (
                  <Card key={r.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 gap-5">
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-serif">
                              {TARGET_TYPE_LABEL[tt]}
                            </Badge>
                            {href ? (
                              <Link
                                href={href}
                                target="_blank"
                                className="inline-flex items-center gap-1 font-serif text-base font-semibold hover:text-primary"
                              >
                                {target?.title ?? "（已删除）"}
                                <ExternalLink className="size-3.5 text-muted-foreground" />
                              </Link>
                            ) : (
                              <span className="font-serif text-base font-semibold">
                                {target?.title ?? "（已删除）"}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            举报人 {r.reporter.nickname || "（未知）"}
                            {ownerNickname && (
                              <>
                                <span className="text-muted-foreground/50"> · </span>
                                当事人 {ownerNickname}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          {formatDateTime(r.createdAt)}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">理由:</span>{" "}
                          <span className="font-medium">{reasonLabel(r.reason)}</span>
                        </div>
                        {r.description ? (
                          <p className="rounded-lg border border-outline-variant/40 bg-background/50 px-3 py-2 text-foreground/90">
                            {r.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-outline-variant/40 pt-4">
                        <ResolveActions reportId={r.id} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="font-serif text-base">已处理</span>
                <Badge variant="outline" className="px-2 py-0.5">
                  {resolved.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {resolved.map((r) => {
                  const tt = r.targetType as ReportTargetType;
                  const target = targetDisplay(tt, r.targetId);
                  const href = targetHref(tt, r.targetId);
                  const action = (r.action ?? "NONE") as ReportAction;
                  const resolverName = r.resolverId
                    ? resolverNick.get(r.resolverId) ?? null
                    : null;
                  return (
                    <Card key={r.id} className="opacity-80">
                      <CardContent className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0 space-y-1 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{TARGET_TYPE_LABEL[tt]}</Badge>
                            {href ? (
                              <Link
                                href={href}
                                target="_blank"
                                className="font-serif font-semibold hover:text-primary"
                              >
                                {target?.title ?? "（已删除）"}
                              </Link>
                            ) : (
                              <span className="font-serif font-semibold">
                                {target?.title ?? "（已删除）"}
                              </span>
                            )}
                            <Badge variant={ACTION_VARIANT[action]}>{ACTION_LABEL[action]}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reasonLabel(r.reason)}
                            {resolverName && (
                              <>
                                <span className="text-muted-foreground/50"> · </span>
                                处理人 {resolverName}
                              </>
                            )}
                            <span className="text-muted-foreground/50"> · </span>
                            {formatDateTime(r.resolvedAt ?? r.createdAt)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
