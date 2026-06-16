import { z } from "zod";
import {
  NEED_CATEGORIES,
  NEED_FORMAT_PREFERENCES,
  EXPECTED_TIMES,
  CONTACT_VISIBILITIES,
} from "@/lib/constants/need";

const categoryEnum = z.enum(NEED_CATEGORIES);
const formatPreferenceEnum = z.enum(NEED_FORMAT_PREFERENCES);
const expectedTimeEnum = z.enum(
  EXPECTED_TIMES.map((t) => t.value) as [
    "ASAP",
    "THIS_WEEK",
    "TWO_WEEKS",
    "FLEXIBLE",
  ]
);
const contactVisibilityEnum = z.enum(CONTACT_VISIBILITIES);

const baseShape = {
  title: z.string().trim().min(1, "请填写标题").max(50, "标题最多 50 字"),
  description: z
    .string()
    .trim()
    .min(1, "请填写描述")
    .max(2000, "描述最多 2000 字"),
  expectedProfile: z
    .string()
    .trim()
    .max(500, "期望画像最多 500 字")
    .optional(),
  reward: z
    .string()
    .trim()
    .min(1, "请填写报酬说明")
    .max(200, "报酬说明最多 200 字"),
  expectedTime: expectedTimeEnum,
  formatPreference: formatPreferenceEnum,
  category: categoryEnum,
  contactInfo: z
    .string()
    .trim()
    .min(1, "请填写联系方式")
    .max(200, "联系方式最多 200 字"),
  contactVisibility: contactVisibilityEnum.default("VERIFIED_ONLY"),
};

export const needCreateSchema = z.object(baseShape);
export type NeedCreateInput = z.infer<typeof needCreateSchema>;

/**
 * 更新:全部可选。
 */
export const needUpdateSchema = z.object({
  title: baseShape.title.optional(),
  description: baseShape.description.optional(),
  expectedProfile: baseShape.expectedProfile,
  reward: baseShape.reward.optional(),
  expectedTime: expectedTimeEnum.optional(),
  formatPreference: formatPreferenceEnum.optional(),
  category: categoryEnum.optional(),
  contactInfo: baseShape.contactInfo.optional(),
  contactVisibility: contactVisibilityEnum.optional(),
});
export type NeedUpdateInput = z.infer<typeof needUpdateSchema>;
