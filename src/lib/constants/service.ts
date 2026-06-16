/**
 * 服务面板常量(分类/形式/时长)。
 * 供发布表单、列表筛选与详情页共用,集中维护以避免漂移。
 */

export const SERVICE_CATEGORIES = [
  "学业辅导",
  "技能教学",
  "文书润色",
  "咨询规划",
  "技术支持",
  "翻译",
  "设计",
  "其他",
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const SERVICE_FORMATS = ["线上", "线下"] as const;
export type ServiceFormat = (typeof SERVICE_FORMATS)[number];

export const DURATION_TIERS = ["30分钟", "1小时", "2小时", "半天", "面议"] as const;
export type DurationTier = (typeof DURATION_TIERS)[number];

export const CONTACT_VISIBILITIES = ["VERIFIED_ONLY", "ALL"] as const;
export type ContactVisibilityValue = (typeof CONTACT_VISIBILITIES)[number];
