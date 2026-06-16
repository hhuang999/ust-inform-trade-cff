"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { createNotification } from "@/lib/notifications";
import type { ReportAction, ReportTargetType } from "@prisma/client";

export type ResolveAction = "NONE" | "WARNING" | "TAKEDOWN" | "BAN";

const ACTION_LABEL: Record<ResolveAction, string> = {
  NONE: "无违规",
  WARNING: "警告",
  TAKEDOWN: "强制下架",
  BAN: "封禁",
};

export async function resolveReport(
  reportId: string,
  action: ResolveAction
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Admin guard — matches admin/verify/actions.ts pattern.
  const session = await auth();
  if (!isAdmin(session?.user ?? null)) {
    return { ok: false, error: "无权限" };
  }
  const resolverId = session!.user!.id;

  if (action !== "NONE" && action !== "WARNING" && action !== "TAKEDOWN" && action !== "BAN") {
    return { ok: false, error: "非法的处理操作" };
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });
  if (!report) return { ok: false, error: "举报不存在" };
  if (report.status === "RESOLVED") {
    return { ok: false, error: "该举报已处理" };
  }

  const targetType = report.targetType as ReportTargetType;
  const now = new Date();

  // Resolve the target's owner and, for posts, the title — used for
  // takedown / ban side-effects and notification bodies.
  const target = await resolveTarget(targetType, report.targetId);
  const ownerId = target?.ownerId ?? null;
  const targetTitle = target?.title ?? null;

  // ── Side effects per action ──────────────────────────────────────────
  // TAKEDOWN: close the target post (no-op for USER — treat like WARNING).
  // BAN: record a Violation for the owner + bump violationCount.
  if (action === "TAKEDOWN" && targetType !== "USER") {
    await closeTargetPost(targetType, report.targetId);
  }
  if (action === "BAN" && ownerId) {
    await prisma.$transaction([
      prisma.violation.create({
        data: {
          userId: ownerId,
          source: "MANUAL",
          reason: `因举报处理被封禁(${report.reason})`,
          reference: report.id,
        },
      }),
      prisma.user.update({
        where: { id: ownerId },
        data: { violationCount: { increment: 1 } },
      }),
    ]);
  }

  // ── Mark the report resolved ─────────────────────────────────────────
  await prisma.report.update({
    where: { id: report.id },
    data: {
      status: "RESOLVED",
      action: action as ReportAction,
      resolverId,
      resolvedAt: now,
    },
  });

  // ── Notifications ────────────────────────────────────────────────────
  // Reporter always gets an outcome notice.
  await createNotification({
    userId: report.reporterId,
    type: "report_resolved",
    title: "举报处理结果",
    body: `你提交的举报已处理完毕,处理结果:${ACTION_LABEL[action]}。`,
    link: null,
  });

  // TAKEDOWN: notify the target owner that their post was removed.
  if (action === "TAKEDOWN" && ownerId) {
    await createNotification({
      userId: ownerId,
      type: "report_takedown",
      title: "你的帖子被强制下架",
      body: targetTitle
        ? `你的「${targetTitle}」因违规被管理员强制下架。`
        : "你的帖子因违规被管理员强制下架。",
      link: null,
    });
  }

  // BAN: notify the banned user their account was penalized.
  if (action === "BAN" && ownerId) {
    await createNotification({
      userId: ownerId,
      type: "report_ban",
      title: "账号因违规被处理",
      body: "你的账号因违规被管理员处理,违规记录已计入账号信用。如有异议请联系管理员。",
      link: null,
    });
  }

  revalidatePath("/admin/reports");
  return { ok: true };
}

// ── helpers ──────────────────────────────────────────────────────────────

async function resolveTarget(
  targetType: ReportTargetType,
  targetId: string
): Promise<{ ownerId: string | null; title: string | null } | null> {
  switch (targetType) {
    case "ITEM": {
      const r = await prisma.item.findUnique({
        where: { id: targetId },
        select: { sellerId: true, title: true },
      });
      return r ? { ownerId: r.sellerId, title: r.title } : null;
    }
    case "SERVICE": {
      const r = await prisma.service.findUnique({
        where: { id: targetId },
        select: { providerId: true, title: true },
      });
      return r ? { ownerId: r.providerId, title: r.title } : null;
    }
    case "NEED": {
      const r = await prisma.need.findUnique({
        where: { id: targetId },
        select: { requesterId: true, title: true },
      });
      return r ? { ownerId: r.requesterId, title: r.title } : null;
    }
    case "USER": {
      const r = await prisma.user.findUnique({
        where: { id: targetId },
        select: { nickname: true },
      });
      return r ? { ownerId: targetId, title: r.nickname } : null;
    }
    default:
      return null;
  }
}

async function closeTargetPost(
  targetType: ReportTargetType,
  targetId: string
): Promise<void> {
  if (targetType === "ITEM") {
    await prisma.item.update({ where: { id: targetId }, data: { status: "CLOSED" } });
  } else if (targetType === "SERVICE") {
    await prisma.service.update({ where: { id: targetId }, data: { status: "CLOSED" } });
  } else if (targetType === "NEED") {
    await prisma.need.update({ where: { id: targetId }, data: { status: "CLOSED" } });
  }
}
