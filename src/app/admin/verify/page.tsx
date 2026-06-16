import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { ShieldCheck } from "lucide-react";

import { ReviewCard } from "./review-card";

export default async function AdminVerifyPage() {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) redirect("/");

  const requests = await prisma.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: {
      user: {
        select: {
          nickname: true,
          realName: true,
          studentId: true,
          department: true,
          enrollmentYear: true,
          email: true,
          phone: true,
          avatarKey: true,
        },
      },
    },
  });

  return (
    <PageContainer className="max-w-4xl space-y-8">
      <SectionHeading
        title="身份认证审核"
        description="核对学生提交的学生证照片,通过或拒绝认证申请。"
        action={
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            待审核 {requests.length}
          </Badge>
        }
      />

      {requests.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/40 bg-card shadow-card">
          <Empty className="py-16">
            <EmptyMedia variant="icon">
              <ShieldCheck />
            </EmptyMedia>
            <EmptyTitle className="font-serif">暂无待审核申请</EmptyTitle>
            <EmptyDescription>
              所有认证申请都已处理完毕,稍后再来看看。
            </EmptyDescription>
          </Empty>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((r) => (
            <ReviewCard
              key={r.id}
              request={{
                id: r.id,
                submittedAt: r.submittedAt,
                photoKeys: r.photoKeys,
                user: {
                  nickname: r.user.nickname,
                  realName: r.user.realName,
                  studentId: r.user.studentId,
                  department: r.user.department,
                  enrollmentYear: r.user.enrollmentYear,
                  email: r.user.email,
                  phone: r.user.phone,
                  avatarKey: r.user.avatarKey,
                },
              }}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
