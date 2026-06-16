import { prisma } from "@/lib/db";

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
}) {
  return prisma.notification.create({ data: params });
}

/** 未读数(导航栏红点用) */
export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}
