import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notificationHref } from "@/lib/notification-href";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  // 计算每条通知的跳转路径,供通知铃铛渲染为可点击链接。
  const items = rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    read: n.read,
    href: notificationHref(n),
  }));
  return NextResponse.json({ items });
}
