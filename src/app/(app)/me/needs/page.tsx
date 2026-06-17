import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronRight,
  HandHeart,
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

export const dynamic = "force-dynamic";

type NeedStatus = "OPEN" | "PAUSED" | "CLOSED";

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

export default async function MyNeedsPage() {
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

  // 我发布的:全部状态(OPEN/PAUSED/CLOSED),确保暂停/关闭/零应征后仍可在此找回与管理。
  const needs = await prisma.need.findMany({
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
  });

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="我发布的需求"
        description="管理你发布、暂停或已关闭的需求"
        action={
          <Button asChild>
            <Link href="/needs/new">
              <Plus />
              发布需求
            </Link>
          </Button>
        }
      />

      {needs.length === 0 ? (
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
      )}
    </PageContainer>
  );
}
