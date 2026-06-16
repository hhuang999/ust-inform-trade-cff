"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canSubmitVerification } from "@/lib/verification/state-machine";
import { createNotification } from "@/lib/notifications";

export type SubmitState = { error?: string; ok?: boolean };

export async function submitVerificationAction(_prev: SubmitState, formData: FormData): Promise<SubmitState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "请先登录" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "用户不存在" };
  if (!canSubmitVerification(user.verificationStatus)) {
    return { error: "当前状态无法提交认证(审核中或已认证)" };
  }

  const keys = String(formData.get("photoKeys") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (keys.length === 0) return { error: "请上传至少一张学生证照片" };

  // 已有 PENDING 则不允许(并发兜底)
  const pending = await prisma.verificationRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
  });
  if (pending) return { error: "已有待审核的申请" };

  await prisma.verificationRequest.create({
    data: { userId: user.id, photoKeys: keys },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationStatus: "PENDING" },
  });

  // 通知(占位:可后续给管理员发;此处仅给用户自己留痕)
  await createNotification({
    userId: user.id,
    type: "verification_submitted",
    title: "认证申请已提交",
    body: "你的学生证认证申请已提交,等待管理员审核。",
    link: "/settings",
  });

  revalidatePath("/settings");
  return { ok: true };
}
