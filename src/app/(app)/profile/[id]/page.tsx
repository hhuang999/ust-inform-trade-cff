import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge, type VerificationStatus } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      nickname: true, avatarKey: true, department: true, enrollmentYear: true,
      realName: true, realNameVisible: true, verificationStatus: true, violationCount: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardContent className="p-6">
          <header className="flex items-center gap-4">
            {user.avatarKey ? (
              <img
                src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${user.avatarKey}`}
                alt=""
                className="h-16 w-16 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground">
                {(user.nickname ?? "?").charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold">{user.nickname}</h1>
                <Badge status={user.verificationStatus as VerificationStatus} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.department} · {user.enrollmentYear}
                {user.realNameVisible && ` · ${user.realName}`}
              </p>
            </div>
          </header>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <span className="text-sm text-muted-foreground">违规次数</span>
          <span className="text-lg font-semibold tabular-nums">{user.violationCount}</span>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">物品交易信誉</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">均分 — · 完成 0 笔</p>
            <p className="mt-1 text-xs text-muted-foreground/60">(P3 填充)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">服务交易信誉</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">均分 — · 完成 0 次</p>
            <p className="mt-1 text-xs text-muted-foreground/60">(P3 填充)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">发布历史</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground/60">(P1/P2 填充)</p>
        </CardContent>
      </Card>
    </div>
  );
}
