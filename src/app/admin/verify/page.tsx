import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { reviewAction } from "./actions";

export default async function AdminVerifyPage() {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) redirect("/");

  const requests = await prisma.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: { user: { select: { realName: true, studentId: true, department: true, email: true, phone: true } } },
  });

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">认证审核</h1>
      {requests.map((r) => (
        <div key={r.id} className="space-y-2 rounded-lg border p-4">
          <p>姓名:{r.user.realName} · 学号:{r.user.studentId} · 院系:{r.user.department}</p>
          <p>账号:{r.user.email ?? r.user.phone}</p>
          <div className="flex flex-wrap gap-2">
            {r.photoKeys.map((k) => (
              // 通过私密接口由管理员读取(下一 Task 实现)
              <img key={k} src={`/api/admin/student-id?key=${encodeURIComponent(k)}`} alt="学生证" className="h-32 border" />
            ))}
          </div>
          <form action={reviewAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="requestId" value={r.id} />
            <input name="reason" placeholder="拒绝理由(拒绝时填)" className="flex-1 border p-1" />
            <button name="decision" value="APPROVED" className="rounded bg-green-600 p-2 text-white">通过</button>
            <button name="decision" value="REJECTED" className="rounded bg-red-600 p-2 text-white">拒绝</button>
          </form>
        </div>
      ))}
      {requests.length === 0 && <p className="text-gray-500">暂无待审核申请。</p>}
    </div>
  );
}
