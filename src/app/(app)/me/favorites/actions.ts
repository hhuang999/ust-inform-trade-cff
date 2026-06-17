"use server";

import { revalidatePath } from "next/cache";
import { type FavoriteTargetType } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  type SessionUser,
} from "@/lib/permissions";

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** 统一鉴权:登录即可(认证已不再作为门槛)。 */
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
    return { error: "请先登录" };
  }
}

/** 收藏目标类型 → 详情路由前缀(用于缓存失效)。 */
function detailRoute(targetType: FavoriteTargetType, targetId: string): string {
  const seg =
    targetType === "ITEM" ? "items" : targetType === "SERVICE" ? "services" : "needs";
  return `/${seg}/${targetId}`;
}

/**
 * 收藏 / 取消收藏(多态:物品 / 服务 / 需求 通用,唯一 [userId, targetType, targetId])。
 */
export async function toggleFavorite(
  targetType: FavoriteTargetType,
  targetId: string
): Promise<ActionResult<{ favorited: boolean }>> {
  const actor = await resolveActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  const existing = await prisma.favorite.findUnique({
    where: {
      userId_targetType_targetId: { userId: actor.id, targetType, targetId },
    },
    select: { id: true },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/me/favorites");
    revalidatePath(detailRoute(targetType, targetId));
    return { ok: true, favorited: false };
  }
  await prisma.favorite.create({
    data: { userId: actor.id, targetType, targetId },
  });
  revalidatePath("/me/favorites");
  revalidatePath(detailRoute(targetType, targetId));
  return { ok: true, favorited: true };
}
