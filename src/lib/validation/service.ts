import { z } from "zod";
import {
  SERVICE_CATEGORIES,
  SERVICE_FORMATS,
  DURATION_TIERS,
  CONTACT_VISIBILITIES,
} from "@/lib/constants/service";

const categoryArray = z
  .array(z.enum(SERVICE_CATEGORIES))
  .min(1, "至少选择一个分类");
const formatArray = z
  .array(z.enum(SERVICE_FORMATS))
  .min(1, "至少选择一种形式");
const durationTierEnum = z.enum(DURATION_TIERS);
const contactVisibilityEnum = z.enum(CONTACT_VISIBILITIES);

const baseShape = {
  title: z.string().trim().min(1, "请填写标题").max(50, "标题最多 50 字"),
  description: z
    .string()
    .trim()
    .min(1, "请填写描述")
    .max(2000, "描述最多 2000 字"),
  qualification: z
    .string()
    .trim()
    .min(1, "请填写资质说明")
    .max(1000, "资质说明最多 1000 字"),
  proofImageKeys: z
    .array(z.string().min(1, "图片 key 不能为空"))
    .max(9, "最多 9 张图片"),
  categories: categoryArray,
  formats: formatArray,
  durationTier: durationTierEnum.optional(),
  price: z
    .string()
    .trim()
    .min(1, "请填写价格")
    .max(100, "价格说明最多 100 字"),
  contactInfo: z
    .string()
    .trim()
    .min(1, "请填写联系方式")
    .max(200, "联系方式最多 200 字"),
  contactVisibility: contactVisibilityEnum.default("VERIFIED_ONLY"),
};

export const serviceCreateSchema = z.object(baseShape);
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

/**
 * 更新:全部可选(分类/形式仍需为有效子集)。
 */
export const serviceUpdateSchema = z.object({
  title: baseShape.title.optional(),
  description: baseShape.description.optional(),
  qualification: baseShape.qualification.optional(),
  proofImageKeys: baseShape.proofImageKeys.optional(),
  categories: categoryArray.optional(),
  formats: formatArray.optional(),
  durationTier: durationTierEnum.nullable().optional(),
  price: baseShape.price.optional(),
  contactInfo: baseShape.contactInfo.optional(),
  contactVisibility: contactVisibilityEnum.optional(),
});
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

/**
 * 时段创建:startAt/endAt 为 ISO 字符串,endAt 须晚于 startAt。
 */
export const slotCreateSchema = z
  .object({
    startAt: z
      .string()
      .min(1, "请填写开始时间")
      .refine((v) => !Number.isNaN(Date.parse(v)), "开始时间格式不正确"),
    endAt: z
      .string()
      .min(1, "请填写结束时间")
      .refine((v) => !Number.isNaN(Date.parse(v)), "结束时间格式不正确"),
  })
  .refine((d) => new Date(d.endAt).getTime() > new Date(d.startAt).getTime(), {
    message: "结束时间须晚于开始时间",
    path: ["endAt"],
  });
export type SlotCreateInput = z.infer<typeof slotCreateSchema>;
