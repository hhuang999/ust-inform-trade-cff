/**
 * 物品面板常量(分类/成色/交易方式/价格模式)。
 * 供发布表单、列表筛选与详情页共用,集中维护以避免漂移。
 */

export const ITEM_CATEGORIES = [
  "数码电子",
  "书籍教材",
  "生活用品",
  "服饰鞋包",
  "运动健身",
  "美妆护肤",
  "乐器",
  "其他",
] as const;
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

export const ITEM_CONDITIONS = [
  "全新",
  "几乎全新",
  "轻微使用痕迹",
  "明显使用痕迹",
] as const;
export type ItemCondition = (typeof ITEM_CONDITIONS)[number];

export const TRADE_METHODS = ["自提", "送货", "邮寄"] as const;
export type TradeMethod = (typeof TRADE_METHODS)[number];

export interface PriceModeOption {
  value: "SPECIFIC" | "FREE" | "NEGOTIABLE";
  label: string;
}

export const PRICE_MODES: PriceModeOption[] = [
  { value: "SPECIFIC", label: "具体金额" },
  { value: "FREE", label: "免费" },
  { value: "NEGOTIABLE", label: "面议" },
];

export const CONTACT_VISIBILITIES = ["VERIFIED_ONLY", "ALL"] as const;
export type ContactVisibilityValue = (typeof CONTACT_VISIBILITIES)[number];
