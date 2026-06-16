import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  UNVERIFIED: "未认证",
  PENDING: "审核中",
  VERIFIED: "已认证",
  REJECTED: "认证未通过",
};

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
    <div className="max-w-2xl space-y-6 p-6">
      <header className="flex items-center gap-4">
        {user.avatarKey ? (
          <img src={`${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${user.avatarKey}`} alt="" className="h-16 w-16 rounded-full" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-gray-200" />
        )}
        <div>
          <h1 className="text-xl font-semibold">{user.nickname}</h1>
          <p className="text-sm text-gray-600">
            {user.department} · {user.enrollmentYear} · {STATUS_LABEL[user.verificationStatus as string]}
            {user.realNameVisible && ` · ${user.realName}`}
          </p>
        </div>
      </header>

      <section className="rounded-lg border p-4">
        <p>违规次数:{user.violationCount}</p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">物品交易信誉</h2>
          <p className="text-sm text-gray-500">均分 — · 完成 0 笔</p>
          <p className="text-sm text-gray-400">(P3 填充)</p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-medium">服务交易信誉</h2>
          <p className="text-sm text-gray-500">均分 — · 完成 0 次</p>
          <p className="text-sm text-gray-400">(P3 填充)</p>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="font-medium">发布历史</h2>
        <p className="text-sm text-gray-400">(P1/P2 填充)</p>
      </section>
    </div>
  );
}
