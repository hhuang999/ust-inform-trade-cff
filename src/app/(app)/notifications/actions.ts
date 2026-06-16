"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { requireVerifiedUser } from "@/lib/permissions";

export type NotificationActionResult = { ok?: true; error?: string };

/** 把当前用户的所有未读通知标为已读。 */
export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const session = await auth();
  const me = requireVerifiedUser(session?.user ?? null);

  await prisma.notification.updateMany({
    where: { userId: me.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { ok: true };
}

/** 标记单条通知为已读(确保归属当前用户)。 */
export async function markNotificationRead(
  id: string
): Promise<NotificationActionResult> {
  const session = await auth();
  const me = requireVerifiedUser(session?.user ?? null);

  await prisma.notification.updateMany({
    where: { id, userId: me.id },
    data: { read: true },
  });

  revalidatePath("/notifications");
  return { ok: true };
}
