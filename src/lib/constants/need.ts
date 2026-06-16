/**
 * 需求面板常量(分类/形式偏好/期望时间)。
 * 与服务面板分类保持一致,集中维护以避免漂移。
 */

import { SERVICE_CATEGORIES } from "@/lib/constants/service";

export const NEED_CATEGORIES = SERVICE_CATEGORIES;
export type NeedCategory = (typeof NEED_CATEGORIES)[number];

export const NEED_FORMAT_PREFERENCES = ["线上", "线下", "都可以"] as const;
export type NeedFormatPreference = (typeof NEED_FORMAT_PREFERENCES)[number];

export interface ExpectedTimeOption {
  value: "ASAP" | "THIS_WEEK" | "TWO_WEEKS" | "FLEXIBLE";
  label: string;
}

export const EXPECTED_TIMES: ExpectedTimeOption[] = [
  { value: "ASAP", label: "尽快" },
  { value: "THIS_WEEK", label: "本周内" },
  { value: "TWO_WEEKS", label: "两周内" },
  { value: "FLEXIBLE", label: "不急,时间灵活" },
];

export const CONTACT_VISIBILITIES = ["VERIFIED_ONLY", "ALL"] as const;
export type ContactVisibilityValue = (typeof CONTACT_VISIBILITIES)[number];
