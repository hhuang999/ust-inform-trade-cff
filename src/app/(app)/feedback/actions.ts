"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  NotVerifiedError,
  type SessionUser,
} from "@/lib/permissions";
import {
  isFeedbackCategory,
  FEEDBACK_CONTENT_MIN,
  FEEDBACK_CONTENT_MAX,
  FEEDBACK_CONTACT_MAX,
} from "@/lib/constants/feedback";

type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** 统一鉴权:登录即可反馈(认证非门槛,与全局权限放宽一致)。 */
async function resolveActor(): Promise<SessionUser | { error: string }> {
  const session = await auth();
  const user: SessionUser | null = session?.user
    ? {
        id: session.user.id,
        role: session.user.role,
        verificationStatus: session.user.verificationStatus,
      }
    : null;
  try {
    return requireVerifiedUser(user);
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return { error: "请先登录" };
    if (e instanceof NotVerifiedError) return { error: "请先完成身份认证" };
    return { error: "请先登录" };
  }
}

export interface CreateFeedbackInput {
  category: unknown;
  content: unknown;
  contact?: unknown;
}

/**
 * 提交用户反馈(开发者信箱)。
 * - 要求已登录。
 * - 校验 category / content(5~1000)/ contact(≤60)。
 */
export async function createFeedback(
  input: CreateFeedbackInput,
): Promise<ActionResult<{ feedbackId: string }>> {
  const actor = await resolveActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  if (!isFeedbackCategory(input?.category)) {
    return { ok: false, error: "请选择反馈类型" };
  }

  const content =
    typeof input?.content === "string" ? input.content.trim() : "";
  if (content.length < FEEDBACK_CONTENT_MIN) {
    return { ok: false, error: `反馈内容至少 ${FEEDBACK_CONTENT_MIN} 个字` };
  }
  if (content.length > FEEDBACK_CONTENT_MAX) {
    return { ok: false, error: `反馈内容最多 ${FEEDBACK_CONTENT_MAX} 个字` };
  }

  const contact =
    typeof input?.contact === "string" ? input.contact.trim() : null;
  if (contact && contact.length > FEEDBACK_CONTACT_MAX) {
    return { ok: false, error: `联系方式最多 ${FEEDBACK_CONTACT_MAX} 个字` };
  }

  const fb = await prisma.feedback.create({
    data: {
      userId: actor.id,
      category: input.category,
      content,
      contact: contact || null,
      status: "PENDING",
    },
    select: { id: true },
  });

  revalidatePath("/admin/feedback");
  return { ok: true, feedbackId: fb.id };
}
