"use server";

import { revalidatePath } from "next/cache";
import { Prisma, DealType } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  NotVerifiedError,
  type SessionUser,
} from "@/lib/permissions";

/**
 * 写入通知。直接落到 notifications 表(而非 createNotification helper)以支持 `data` 字段。
 */
function notify(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  data?: Prisma.InputJsonValue;
}) {
  return prisma.notification.create({ data: params });
}

type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

/** 统一鉴权:将 requireVerifiedUser 的异常映射为可返回给客户端的错误对象。 */
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

const createReviewSchema = z.object({
  dealType: z.enum(["ITEM", "BOOKING", "NEED_MATCH"]),
  dealId: z.string().min(1, "缺少交易标识"),
  rating: z.number().int().min(1, "请选择评分").max(5, "评分最高 5 分"),
  content: z
    .string()
    .trim()
    .max(200, "评价内容不超过 200 字")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

/**
 * 解析一笔交易:校验 reviewer 是参与方且交易状态为 COMPLETED,返回 revieweeId。
 * reviewee = 交易中的另一方。
 */
async function resolveDeal(
  dealType: DealType,
  dealId: string,
  reviewerId: string
): Promise<{ revieweeId: string } | { error: string }> {
  if (dealType === "ITEM") {
    const deal = await prisma.itemDeal.findUnique({
      where: { id: dealId },
      select: { sellerId: true, buyerId: true, status: true },
    });
    if (!deal) return { error: "交易不存在" };
    if (deal.status !== "COMPLETED") return { error: "该交易尚未完成,不可评价" };
    const isSeller = deal.sellerId === reviewerId;
    const isBuyer = deal.buyerId === reviewerId;
    if (!isSeller && !isBuyer) return { error: "无权评价此交易" };
    return { revieweeId: isSeller ? deal.buyerId : deal.sellerId };
  }

  if (dealType === "BOOKING") {
    const booking = await prisma.booking.findUnique({
      where: { id: dealId },
      select: {
        clientId: true,
        status: true,
        service: { select: { providerId: true } },
      },
    });
    if (!booking) return { error: "预约不存在" };
    if (booking.status !== "COMPLETED") return { error: "该预约尚未完成,不可评价" };
    const isClient = booking.clientId === reviewerId;
    const isProvider = booking.service.providerId === reviewerId;
    if (!isClient && !isProvider) return { error: "无权评价此预约" };
    return { revieweeId: isClient ? booking.service.providerId : booking.clientId };
  }

  // NEED_MATCH
  const match = await prisma.needMatch.findUnique({
    where: { id: dealId },
    select: {
      providerId: true,
      status: true,
      need: { select: { requesterId: true } },
    },
  });
  if (!match) return { error: "对接不存在" };
  if (match.status !== "COMPLETED") return { error: "该对接尚未完成,不可评价" };
  const isProvider = match.providerId === reviewerId;
  const isRequester = match.need.requesterId === reviewerId;
  if (!isProvider && !isRequester) return { error: "无权评价此对接" };
  return { revieweeId: isProvider ? match.need.requesterId : match.providerId };
}

function revalidateDealRoutes(
  dealType: DealType,
  revieweeId: string,
  reviewerId: string
) {
  void dealType;
  revalidatePath("/me/items");
  revalidatePath("/me/bookings");
  revalidatePath("/me/matches");
  revalidatePath(`/profile/${revieweeId}`);
  revalidatePath(`/profile/${reviewerId}`);
}

/**
 * 提交评价(双盲)。创建时 revealed=false;若对方也已评价,则同时公开双方评价。
 */
export async function createReview(
  input: z.infer<typeof createReviewSchema>
): Promise<ActionResult<{ revealed: boolean }>> {
  const actor = await resolveActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const parsed = createReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "参数校验失败" };
  }
  const { dealType, dealId, rating, content } = parsed.data;

  const deal = await resolveDeal(dealType as DealType, dealId, actor.id);
  if ("error" in deal) return { ok: false, error: deal.error };
  const revieweeId = deal.revieweeId;

  if (revieweeId === actor.id) {
    return { ok: false, error: "不能评价自己" };
  }

  // 创建评价(唯一 [dealType, dealId, reviewerId]);冲突 → 已评价过。
  try {
    await prisma.review.create({
      data: {
        dealType: dealType as DealType,
        dealId,
        reviewerId: actor.id,
        revieweeId,
        rating,
        content,
        revealed: false,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "你已评价过" };
    }
    throw e;
  }

  // 双盲公开:若对方也已为该交易提交评价,则同时公开双方。
  const otherReview = await prisma.review.findUnique({
    where: {
      dealType_dealId_reviewerId: {
        dealType: dealType as DealType,
        dealId,
        reviewerId: revieweeId,
      },
    },
    select: { id: true, revieweeId: true },
  });

  if (otherReview) {
    // 对方评价的 revieweeId 应为当前 reviewer(actor.id)。
    const now = new Date();
    await prisma.review.updateMany({
      where: {
        dealType: dealType as DealType,
        dealId,
        revealed: false,
        reviewerId: { in: [actor.id, revieweeId] },
      },
      data: { revealed: true, revealedAt: now },
    });

    // 通知双方:收到新评价(已公开)。链接到各自资料页。
    await Promise.all([
      notify({
        userId: revieweeId,
        type: "review_received",
        title: "收到新评价",
        body: "双方均已完成评价,评价现已公开。",
        link: `/profile/${revieweeId}`,
        data: { dealType, dealId },
      }),
      notify({
        userId: actor.id,
        type: "review_received",
        title: "收到新评价",
        body: "双方均已完成评价,评价现已公开。",
        link: `/profile/${actor.id}`,
        data: { dealType, dealId },
      }),
    ]);

    revalidateDealRoutes(dealType as DealType, revieweeId, actor.id);
    return { ok: true, revealed: true };
  }

  // 仅一方评价:保持隐藏,不通知。
  revalidateDealRoutes(dealType as DealType, revieweeId, actor.id);
  return { ok: true, revealed: false };
}
