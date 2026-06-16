"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { isValidReview, userStatusAfterReview, type ReviewDecision } from "@/lib/verification/state-machine";
import { createNotification } from "@/lib/notifications";

export async function reviewAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) return;

  const requestId = String(formData.get("requestId"));
  const decision = String(formData.get("decision")) as ReviewDecision;
  if (decision !== "APPROVED" && decision !== "REJECTED") return;
  const reason = formData.get("reason") ? String(formData.get("reason")) : null;

  const req = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
  if (!req) return;
  if (!isValidReview(req.status, decision)) return;

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status: decision, reviewerId: session!.user!.id, reviewedAt: new Date(), reason },
    }),
    prisma.user.update({
      where: { id: req.userId },
      data: { verificationStatus: userStatusAfterReview(decision) },
    }),
  ]);

  await createNotification({
    userId: req.userId,
    type: decision === "APPROVED" ? "verification_approved" : "verification_rejected",
    title: decision === "APPROVED" ? "认证已通过" : "认证未通过",
    body: decision === "APPROVED" ? "你的学生证认证已通过。" : `认证未通过。${reason ?? ""}`.trim(),
    link: "/settings",
  });

  revalidatePath("/admin/verify");
  return;
}
