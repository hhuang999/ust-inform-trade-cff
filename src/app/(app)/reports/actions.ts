"use server";

import type {
  ReportReason,
  ReportTargetType,
} from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  NotVerifiedError,
  type SessionUser,
} from "@/lib/permissions";
import {
  REPORT_TARGET_TYPES,
  REPORT_DESCRIPTION_MAX,
  isReportReason,
} from "@/lib/constants/report";

type ActionResult<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

type ReportTargetTypeValue = (typeof REPORT_TARGET_TYPES)[number];

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

/** 举报目标是否真实存在(按类型查表;排除已软删除)。防伪造 / 悬挂 targetId / IDOR。 */
async function targetExistsForType(
  targetType: ReportTargetType,
  targetId: string
): Promise<boolean> {
  if (targetType === "ITEM") {
    const r = await prisma.item.findUnique({ where: { id: targetId }, select: { id: true, deletedAt: true } });
    return !!r && !r.deletedAt;
  }
  if (targetType === "SERVICE") {
    const r = await prisma.service.findUnique({ where: { id: targetId }, select: { id: true, deletedAt: true } });
    return !!r && !r.deletedAt;
  }
  if (targetType === "NEED") {
    const r = await prisma.need.findUnique({ where: { id: targetId }, select: { id: true, deletedAt: true } });
    return !!r && !r.deletedAt;
  }
  const r = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, deletedAt: true } });
  return !!r && !r.deletedAt;
}

export interface CreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}

/**
 * 提交举报。
 * - 要求「已登录 + 已认证」。
 * - 校验 targetType / targetId / reason,description ≤ 500。
 * - 禁止举报自己(targetType=USER 且 targetId===reporter)。
 * - 创建 Report status=PENDING。
 */
export async function createReport(
  input: CreateReportInput
): Promise<ActionResult<{ reportId: string }>> {
  const actor = await resolveActor();
  if ("error" in actor) return { ok: false, error: actor.error };

  // targetType / targetId 非空。
  const targetType = input?.targetType;
  const targetId =
    typeof input?.targetId === "string" ? input.targetId.trim() : "";
  if (
    typeof targetType !== "string" ||
    !REPORT_TARGET_TYPES.includes(targetType as ReportTargetTypeValue) ||
    !targetId
  ) {
    return { ok: false, error: "举报目标无效" };
  }

  // reason 合法。
  if (!isReportReason(input?.reason)) {
    return { ok: false, error: "请选择举报理由" };
  }

  // description 截断 / 长度校验。
  const description =
    typeof input?.description === "string"
      ? input.description.trim()
      : null;
  if (description && description.length > REPORT_DESCRIPTION_MAX) {
    return { ok: false, error: "补充说明最多 500 字" };
  }

  // 禁止举报自己。
  if (targetType === "USER" && targetId === actor.id) {
    return { ok: false, error: "不能举报自己" };
  }

  // 举报目标必须真实存在(防伪造 / 悬挂 targetId)。
  const exists = await targetExistsForType(targetType as ReportTargetType, targetId);
  if (!exists) return { ok: false, error: "举报目标不存在" };

  // 去重:同一用户对同一目标的 PENDING 举报只保留一条(处理后可再次举报)。
  const dup = await prisma.report.findFirst({
    where: {
      reporterId: actor.id,
      targetType: targetType as ReportTargetType,
      targetId,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (dup) return { ok: false, error: "你已举报过该内容,请等待处理" };

  const report = await prisma.report.create({
    data: {
      reporterId: actor.id,
      targetType: targetType as ReportTargetType,
      targetId,
      reason: input.reason,
      description: description || null,
      status: "PENDING",
    },
    select: { id: true },
  });

  return { ok: true, reportId: report.id };
}
