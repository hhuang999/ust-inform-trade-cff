import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/layout/page-container";
import { SectionHeading } from "@/components/site/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import {
  Badge,
  type VerificationStatus,
} from "@/components/ui/badge";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      nickname: true,
      email: true,
      avatarKey: true,
      verificationStatus: true,
    },
  });
  if (!user) redirect("/login");

  // 最新的审核未通过原因(如有)
  const lastRejected = user.verificationStatus === "REJECTED"
    ? await prisma.verificationRequest.findFirst({
        where: { userId: session.user.id, status: "REJECTED" },
        orderBy: { reviewedAt: "desc" },
        select: { reason: true },
      })
    : null;

  const status = user.verificationStatus as VerificationStatus;

  const statusInfo = {
    icon: ShieldQuestion,
    description: "上传学生证完成认证",
    tone: "text-unverified bg-unverified-soft ring-unverified/20",
  } as const;
  const resolved =
    status === "PENDING"
      ? {
          icon: Clock,
          description: "管理员审核中，请耐心等待",
          tone: "text-pending bg-pending-soft ring-pending/20",
        }
      : status === "VERIFIED"
        ? {
            icon: ShieldCheck,
            description: "已认证，可信社区成员",
            tone: "text-verified bg-verified-soft ring-verified/20",
          }
        : status === "REJECTED"
          ? {
              icon: ShieldAlert,
              description: lastRejected?.reason
                ? `认证未通过：${lastRejected.reason}`
                : "认证未通过，可重新提交",
              tone: "text-rejected bg-rejected-soft ring-rejected/20",
            }
          : statusInfo;

  const StatusIcon = resolved.icon;

  const avatarUrl = user.avatarKey
    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${user.avatarKey}`
    : null;

  return (
    <PageContainer className="max-w-2xl">
      <div className="space-y-6">
        <SectionHeading
          title="设置"
          description="管理你的头像与学生证认证状态"
        />

        {/* 当前认证状态卡 */}
        <Card
          className={cn(
            "animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden",
            "ring-1 ring-inset",
            resolved.tone,
            "border-transparent"
          )}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                  resolved.tone
                )}
              >
                <StatusIcon className="size-5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-serif text-base font-semibold">
                    当前认证状态
                  </span>
                  <Badge status={status} />
                </div>
                <p className="text-sm leading-relaxed opacity-90">
                  {resolved.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <SettingsForm
          verificationStatus={status}
          avatarUrl={avatarUrl}
          nickname={user.nickname}
        />
      </div>
    </PageContainer>
  );
}
