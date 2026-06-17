import type { DealType } from "@prisma/client";

import { prisma } from "@/lib/db";

export interface RatingSummary {
  avg: number;
  count: number;
}

/**
 * 批量聚合一组用户在指定交易类型下的「已公开(revealed)」评价平均分与条数。
 * 返回 userId -> { avg(保留1位小数), count }。无评价的用户不在结果中。
 *
 * 用于列表/卡片旁的信誉标签(PRD §5.5):物品卡用 ITEM,服务卡用 BOOKING,需求卡用 NEED_MATCH。
 */
export async function aggregateRatings(
  userIds: string[],
  dealType: DealType,
): Promise<Record<string, RatingSummary>> {
  if (userIds.length === 0) return {};
  const rows = await prisma.review.groupBy({
    by: ["revieweeId"],
    where: { dealType, revealed: true, revieweeId: { in: userIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const map: Record<string, RatingSummary> = {};
  for (const r of rows) {
    map[r.revieweeId] = {
      avg: r._avg.rating != null ? Math.round(r._avg.rating * 10) / 10 : 0,
      count: r._count.rating,
    };
  }
  return map;
}

/** 从评分表取数字(无评价返回 null,直接喂给卡片 rating/sellerRating)。 */
export function ratingNumber(
  map: Record<string, RatingSummary>,
  userId: string,
): number | null {
  const s = map[userId];
  return s && s.count > 0 ? s.avg : null;
}
