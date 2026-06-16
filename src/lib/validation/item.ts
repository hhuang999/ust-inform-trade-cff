import { z } from "zod";
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  TRADE_METHODS,
  CONTACT_VISIBILITIES,
} from "@/lib/constants/item";

const categoryEnum = z.enum(ITEM_CATEGORIES);
const conditionEnum = z.enum(ITEM_CONDITIONS);
const tradeMethodEnum = z.enum(TRADE_METHODS);
const priceModeEnum = z.enum(["SPECIFIC", "FREE", "NEGOTIABLE"]);
const contactVisibilityEnum = z.enum(CONTACT_VISIBILITIES);

/**
 * 价格与价格模式的联动校验:
 * - priceMode === SPECIFIC 时 price 必填且为非负整数;
 * - priceMode !== SPECIFIC 时 price 必须为空。
 */
function refinePrice(ctx: {
  priceMode?: "SPECIFIC" | "FREE" | "NEGOTIABLE";
  price?: number | null;
}): { path: ["price"]; message: string }[] {
  const { priceMode, price } = ctx;
  const issues: { path: ["price"]; message: string }[] = [];
  if (priceMode === "SPECIFIC") {
    if (price === undefined || price === null) {
      issues.push({ path: ["price"], message: "选择具体金额时必须填写价格" });
    }
  } else if (price !== undefined && price !== null) {
    issues.push({ path: ["price"], message: "免费或面议时不应填写价格" });
  }
  return issues;
}

/**
 * 自提与自提地点联动:
 * - tradeMethods 含「自提」时 pickupLocation 必填。
 */
function refinePickupLocation(ctx: {
  tradeMethods?: string[];
  pickupLocation?: string | null;
}): { path: ["pickupLocation"]; message: string }[] {
  const { tradeMethods = [], pickupLocation } = ctx;
  if (tradeMethods.includes("自提")) {
    if (!pickupLocation || pickupLocation.trim().length === 0) {
      return [
        { path: ["pickupLocation"], message: "交易方式含自提时必须填写自提地点" },
      ];
    }
  }
  return [];
}

const baseShape = {
  title: z.string().trim().min(1, "请填写标题").max(50, "标题最多 50 字"),
  description: z
    .string()
    .trim()
    .min(1, "请填写描述")
    .max(2000, "描述最多 2000 字"),
  category: categoryEnum,
  condition: conditionEnum,
  priceMode: priceModeEnum,
  price: z.number().int("价格须为整数").nonnegative("价格不能为负").optional(),
  originalPrice: z
    .number()
    .int("原价须为整数")
    .nonnegative("原价不能为负")
    .optional(),
  imageKeys: z
    .array(z.string().min(1, "图片 key 不能为空"))
    .min(1, "至少上传 1 张图片")
    .max(9, "最多 9 张图片"),
  tags: z.array(z.string()).max(8, "标签最多 8 个").optional(),
  tradeMethods: z
    .array(tradeMethodEnum)
    .min(1, "至少选择一种交易方式"),
  pickupLocation: z.string().trim().max(200, "自提地点最多 200 字").optional(),
  contactInfo: z
    .string()
    .trim()
    .min(1, "请填写联系方式")
    .max(200, "联系方式最多 200 字"),
  contactVisibility: contactVisibilityEnum.default("VERIFIED_ONLY"),
};

export const itemCreateSchema = z
  .object(baseShape)
  .superRefine((data, ctx) => {
    for (const issue of refinePrice(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue });
    }
    for (const issue of refinePickupLocation(data)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue });
    }
  });

export type ItemCreateInput = z.infer<typeof itemCreateSchema>;

/**
 * 更新:除条件联动外全部可选。当对应字段存在时仍执行联动校验。
 */
export const itemUpdateSchema = z
  .object({
    title: baseShape.title.optional(),
    description: baseShape.description.optional(),
    category: categoryEnum.optional(),
    condition: conditionEnum.optional(),
    priceMode: priceModeEnum.optional(),
    price: baseShape.price,
    originalPrice: baseShape.originalPrice,
    imageKeys: baseShape.imageKeys.optional(),
    tags: baseShape.tags,
    tradeMethods: z.array(tradeMethodEnum).min(1, "至少选择一种交易方式").optional(),
    pickupLocation: baseShape.pickupLocation,
    contactInfo: baseShape.contactInfo.optional(),
    contactVisibility: contactVisibilityEnum.optional(),
  })
  .superRefine((data, ctx) => {
    // 仅在给出 priceMode 时校验价格联动(允许单独更新其它字段)。
    if (data.priceMode !== undefined) {
      for (const issue of refinePrice({ priceMode: data.priceMode, price: data.price })) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue });
      }
    }
    // 仅在给出 tradeMethods 时校验自提地点联动。
    if (data.tradeMethods !== undefined) {
      for (const issue of refinePickupLocation({
        tradeMethods: data.tradeMethods,
        pickupLocation: data.pickupLocation,
      })) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, ...issue });
      }
    }
  });

export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
