import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * 写入通知。直接落到 notifications 表以支持 `data` 字段。
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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * MS_PER_DAY);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * MS_PER_DAY);

  let autoCompleted = 0;
  let liabilityDefaults = 0;
  let reviewsRevealed = 0;

  // ───────────────────────── Job 1 — 7-day auto-complete ─────────────────────────
  try {
    // ItemDeal: PENDING, first confirmed ≥7d ago → COMPLETED + Item SOLD.
    const expiredDeals = await prisma.itemDeal.findMany({
      where: {
        status: "PENDING",
        firstConfirmedAt: { not: null, lt: sevenDaysAgo },
      },
      select: { id: true, itemId: true, sellerId: true, buyerId: true },
    });
    for (const deal of expiredDeals) {
      try {
        await prisma.$transaction([
          prisma.itemDeal.update({
            where: { id: deal.id },
            data: { status: "COMPLETED", completedAt: now },
          }),
          prisma.item.update({
            where: { id: deal.itemId },
            data: { status: "SOLD" },
          }),
        ]);
        await Promise.all([
          notify({
            userId: deal.sellerId,
            type: "item_auto_completed",
            title: "交易已自动完成",
            body: "交易已自动完成,请互评",
            link: "/me/items",
            data: { dealId: deal.id },
          }),
          notify({
            userId: deal.buyerId,
            type: "item_auto_completed",
            title: "交易已自动完成",
            body: "交易已自动完成,请互评",
            link: "/me/items",
            data: { dealId: deal.id },
          }),
        ]);
        autoCompleted++;
      } catch (err) {
        console.error("[cron/timeout] itemDeal auto-complete failed", deal.id, err);
      }
    }

    // Booking: CONFIRMED ≥7d ago → COMPLETED.
    const expiredBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        firstConfirmedAt: { lt: sevenDaysAgo },
      },
      select: { id: true, clientId: true, serviceId: true },
    });
    for (const booking of expiredBookings) {
      try {
        const providerId = (
          await prisma.service.findUnique({
            where: { id: booking.serviceId },
            select: { providerId: true },
          })
        )?.providerId;
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "COMPLETED", completedAt: now },
        });
        await Promise.all(
          [
            booking.clientId,
            providerId,
          ]
            .filter((id): id is string => Boolean(id))
            .map((userId) =>
              notify({
                userId,
                type: "service_auto_completed",
                title: "服务已自动完成",
                body: "服务已自动完成,请互评",
                link: "/me/bookings",
              }),
            ),
        );
        autoCompleted++;
      } catch (err) {
        console.error("[cron/timeout] booking auto-complete failed", booking.id, err);
      }
    }

    // NeedMatch: MATCHED ≥7d ago → COMPLETED.
    const expiredMatches = await prisma.needMatch.findMany({
      where: {
        status: "MATCHED",
        firstConfirmedAt: { lt: sevenDaysAgo },
      },
      select: { id: true, providerId: true, needId: true },
    });
    for (const match of expiredMatches) {
      try {
        const requesterId = (
          await prisma.need.findUnique({
            where: { id: match.needId },
            select: { requesterId: true },
          })
        )?.requesterId;
        await prisma.needMatch.update({
          where: { id: match.id },
          data: { status: "COMPLETED", completedAt: now },
        });
        await Promise.all(
          [match.providerId, requesterId]
            .filter((id): id is string => Boolean(id))
            .map((userId) =>
              notify({
                userId,
                type: "need_auto_completed",
                title: "需求已自动完成",
                body: "需求已自动完成,请互评",
                link: "/me/matches",
              }),
            ),
        );
        autoCompleted++;
      } catch (err) {
        console.error("[cron/timeout] needMatch auto-complete failed", match.id, err);
      }
    }
  } catch (err) {
    console.error("[cron/timeout] Job 1 (auto-complete) failed", err);
  }

  // ───────────────────────── Job 2 — 7-day liability default ─────────────────────────
  try {
    // Booking: CANCELLING >7d, no decision → CANCELLED + disagreement violation for canceller.
    const defaultingBookings = await prisma.booking.findMany({
      where: {
        status: "CANCELLING",
        cancelledAt: { lt: sevenDaysAgo },
        liabilityAgreed: null,
      },
      select: { id: true, clientId: true, serviceId: true, cancelledById: true },
    });
    for (const booking of defaultingBookings) {
      try {
        const providerId = (
          await prisma.service.findUnique({
            where: { id: booking.serviceId },
            select: { providerId: true },
          })
        )?.providerId;
        await prisma.$transaction(async (tx) => {
          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: "CANCELLED",
              liabilityAgreed: false,
              liabilityDecidedAt: now,
            },
          });
          if (booking.cancelledById) {
            await tx.user.update({
              where: { id: booking.cancelledById },
              data: { violationCount: { increment: 1 } },
            });
            await tx.violation.create({
              data: {
                userId: booking.cancelledById,
                source: "BOOKING_CANCEL",
                reason: "取消超时未确认责任,默认计违规",
                reference: booking.id,
              },
            });
          }
        });
        await Promise.all(
          [booking.clientId, providerId]
            .filter((id): id is string => Boolean(id))
            .map((userId) =>
              notify({
                userId,
                type: "service_cancel_violation",
                title: "取消已生效",
                body: "取消已生效(计违规)",
                link: "/me/bookings",
              }),
            ),
        );
        liabilityDefaults++;
      } catch (err) {
        console.error("[cron/timeout] booking liability default failed", booking.id, err);
      }
    }

    // NeedMatch: CANCELLING >7d, no decision → CANCELLED + disagreement violation for canceller.
    const defaultingMatches = await prisma.needMatch.findMany({
      where: {
        status: "CANCELLING",
        cancelledAt: { lt: sevenDaysAgo },
        liabilityAgreed: null,
      },
      select: { id: true, providerId: true, needId: true, cancelledById: true },
    });
    for (const match of defaultingMatches) {
      try {
        const requesterId = (
          await prisma.need.findUnique({
            where: { id: match.needId },
            select: { requesterId: true },
          })
        )?.requesterId;
        await prisma.$transaction(async (tx) => {
          await tx.needMatch.update({
            where: { id: match.id },
            data: {
              status: "CANCELLED",
              liabilityAgreed: false,
              liabilityDecidedAt: now,
            },
          });
          if (match.cancelledById) {
            await tx.user.update({
              where: { id: match.cancelledById },
              data: { violationCount: { increment: 1 } },
            });
            await tx.violation.create({
              data: {
                userId: match.cancelledById,
                source: "MATCH_CANCEL",
                reason: "取消超时未确认责任,默认计违规",
                reference: match.id,
              },
            });
          }
        });
        await Promise.all(
          [match.providerId, requesterId]
            .filter((id): id is string => Boolean(id))
            .map((userId) =>
              notify({
                userId,
                type: "service_cancel_violation",
                title: "取消已生效",
                body: "取消已生效(计违规)",
                link: "/me/matches",
              }),
            ),
        );
        liabilityDefaults++;
      } catch (err) {
        console.error("[cron/timeout] needMatch liability default failed", match.id, err);
      }
    }
  } catch (err) {
    console.error("[cron/timeout] Job 2 (liability default) failed", err);
  }

  // ───────────────────────── Job 3 — 30-day review reveal ─────────────────────────
  try {
    const pendingReviews = await prisma.review.findMany({
      where: {
        revealed: false,
        createdAt: { lt: thirtyDaysAgo },
      },
      select: { id: true, revieweeId: true },
    });
    for (const review of pendingReviews) {
      try {
        await prisma.review.update({
          where: { id: review.id },
          data: { revealed: true, revealedAt: now },
        });
        await notify({
          userId: review.revieweeId,
          type: "review_received",
          title: "收到新评价",
          body: "收到新评价",
          link: `/profile/${review.revieweeId}`,
        });
        reviewsRevealed++;
      } catch (err) {
        console.error("[cron/timeout] review reveal failed", review.id, err);
      }
    }
  } catch (err) {
    console.error("[cron/timeout] Job 3 (review reveal) failed", err);
  }

  return NextResponse.json({ ok: true, autoCompleted, liabilityDefaults, reviewsRevealed });
}
