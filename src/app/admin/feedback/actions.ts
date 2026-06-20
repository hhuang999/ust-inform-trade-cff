"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";

const REPLY_MAX = 500;

/**
 * 管理员回复反馈并标记为已处理。
 * - 仅 ADMIN。
 * - 写入 reply / reviewedById / reviewedAt,状态 → RESOLVED。
 * - 通过站内通知把回复推送给反馈者(替代邮件,完成「信箱」闭环)。
 */
export async function resolveFeedback(
  feedbackId: string,
  reply: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) {
    return { ok: false, error: "无权限" };
  }

  const replyTrim = (reply ?? "").trim();
  if (replyTrim.length > REPLY_MAX) {
    return { ok: false, error: `回复最多 ${REPLY_MAX} 字` };
  }

  const fb = await prisma.feedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, userId: true },
  });
  if (!fb) return { ok: false, error: "反馈不存在" };

  await prisma.feedback.update({
    where: { id: feedbackId },
    data: {
      status: "RESOLVED",
      reply: replyTrim || null,
      reviewedById: session!.user!.id,
      reviewedAt: new Date(),
    },
  });

  await createNotification({
    userId: fb.userId,
    type: "feedback_resolved",
    title: "你的反馈已收到回复",
    body: replyTrim
      ? `开发者回复:${replyTrim}`
      : "开发者已处理你的反馈,感谢支持!",
    link: "/feedback",
  });

  revalidatePath("/admin/feedback");
  return { ok: true };
}
