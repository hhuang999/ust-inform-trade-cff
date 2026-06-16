import type { ReportReason } from "@prisma/client";

/**
 * 举报面板常量(举报理由 / 目标类型 / 中文标签)。
 * 供举报对话框与举报服务端 action 共用,集中维护以避免漂移。
 */

export const REPORT_TARGET_TYPES = [
  "ITEM",
  "SERVICE",
  "NEED",
  "USER",
] as const;
export type ReportTargetTypeValue = (typeof REPORT_TARGET_TYPES)[number];

export interface ReportReasonOption {
  value: ReportReason;
  label: string;
}

export const REPORT_REASONS: ReportReasonOption[] = [
  { value: "FALSE_INFO", label: "虚假信息" },
  { value: "SUSPECTED_FRAUD", label: "涉嫌诈骗" },
  { value: "INAPPROPRIATE", label: "不当内容" },
  { value: "INVALID_CONTACT", label: "联系方式无效" },
  { value: "OTHER", label: "其他" },
];

/** 校验某值是否为合法的 ReportReason。 */
export function isReportReason(value: unknown): value is ReportReason {
  return (
    typeof value === "string" &&
    REPORT_REASONS.some((r) => r.value === value)
  );
}

export const REPORT_DESCRIPTION_MAX = 500;
