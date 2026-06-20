import type { FeedbackCategory } from "@prisma/client";

/**
 * 用户反馈(开发者信箱)常量:分类与中文标签。
 * 供用户端反馈表单与管理后台共用,集中维护避免漂移。
 */

export interface FeedbackCategoryOption {
  value: FeedbackCategory;
  label: string;
}

export const FEEDBACK_CATEGORIES: FeedbackCategoryOption[] = [
  { value: "BUG", label: "Bug / 故障" },
  { value: "USABILITY", label: "使用体验" },
  { value: "FEATURE", label: "功能建议" },
  { value: "OTHER", label: "其他" },
];

/** 校验某值是否为合法的 FeedbackCategory。 */
export function isFeedbackCategory(
  value: unknown,
): value is FeedbackCategory {
  return (
    typeof value === "string" &&
    FEEDBACK_CATEGORIES.some((c) => c.value === value)
  );
}

export function feedbackCategoryLabel(value: string): string {
  return FEEDBACK_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export const FEEDBACK_CONTENT_MIN = 5;
export const FEEDBACK_CONTENT_MAX = 1000;
export const FEEDBACK_CONTACT_MAX = 60;
