import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { feedbackCategoryLabel } from "@/lib/constants/feedback";
import { formatDateTime } from "@/lib/time";
import { ResolveActions } from "./resolve-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "待处理",
  REVIEWED: "已查看",
  RESOLVED: "已回复",
};

export default async function AdminFeedbackPage() {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) redirect("/");

  const feedbacks = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { nickname: true } } },
  });

  const pendingCount = feedbacks.filter((f) => f.status === "PENDING").length;

  return (
    <PageContainer className="space-y-6">
      <SectionHeading
        title="用户反馈"
        description={`开发者信箱 · 共 ${feedbacks.length} 条${pendingCount > 0 ? ` · 待处理 ${pendingCount}` : ""}`}
      />

      {feedbacks.length === 0 ? (
        <Empty className="min-h-[320px] border bg-card/40">
          <EmptyMedia variant="icon">
            <MessageSquare />
          </EmptyMedia>
          <EmptyTitle>暂无反馈</EmptyTitle>
          <EmptyDescription>
            用户在「反馈与建议」提交的意见会出现在这里。
          </EmptyDescription>
        </Empty>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((f) => (
            <Card key={f.id}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {feedbackCategoryLabel(f.category)}
                  </Badge>
                  <Badge
                    variant={f.status === "RESOLVED" ? "secondary" : "default"}
                  >
                    {STATUS_LABEL[f.status] ?? f.status}
                  </Badge>
                  <span className="text-sm font-medium">
                    {f.user?.nickname ?? "未知用户"}
                  </span>
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                    {formatDateTime(f.createdAt)}
                  </span>
                </div>

                <p className="whitespace-pre-line text-sm text-foreground/90">
                  {f.content}
                </p>

                {f.contact ? (
                  <p className="text-xs text-muted-foreground">
                    联系方式:{f.contact}
                  </p>
                ) : null}

                {f.reply ? (
                  <p className="rounded-md bg-verified-soft/60 px-3 py-2 text-sm">
                    <span className="font-medium">开发者回复:</span> {f.reply}
                  </p>
                ) : null}

                {f.status !== "RESOLVED" ? (
                  <ResolveActions feedbackId={f.id} />
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

// formatDateTime 统一来自 @/lib/time,显式 Asia/Shanghai。
