import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { reviewAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminVerifyPage() {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) redirect("/");

  const requests = await prisma.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: { realName: true, studentId: true, department: true, email: true, phone: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">认证审核</h1>
        <p className="text-sm text-muted-foreground">
          待审核申请 <span className="font-medium text-foreground">{requests.length}</span> 条
        </p>
      </div>

      {requests.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">{r.user.realName}</CardTitle>
              <Badge status="PENDING" />
            </div>
            <p className="text-sm text-muted-foreground">
              学号 {r.user.studentId} · {r.user.department}
            </p>
            <p className="text-xs text-muted-foreground">
              账号 {r.user.email ?? r.user.phone}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {r.photoKeys.map((k) => (
                // 通过私密接口由管理员读取(下一 Task 实现)
                <img
                  key={k}
                  src={`/api/admin/student-id?key=${encodeURIComponent(k)}`}
                  alt="学生证"
                  className="h-32 rounded-lg border border-border object-cover shadow-sm"
                />
              ))}
            </div>
            <form action={reviewAction} className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <input type="hidden" name="requestId" value={r.id} />
              <Input
                name="reason"
                placeholder="拒绝理由(拒绝时填)"
                className="min-w-[12rem] flex-1"
              />
              <Button name="decision" value="APPROVED" variant="success">
                通过
              </Button>
              <Button name="decision" value="REJECTED" variant="danger">
                拒绝
              </Button>
            </form>
          </CardContent>
        </Card>
      ))}
      {requests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <svg
              className="h-10 w-10 text-muted-foreground/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-muted-foreground">暂无待审核申请</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
