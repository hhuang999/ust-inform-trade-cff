export type ContactVisibility = "VERIFIED_ONLY" | "ALL";

export interface ContactContext {
  visibility: ContactVisibility;
  contactInfo?: string | null;
  /** null = 未登录; true = 已认证; false = 已登录未认证 */
  viewerVerified: boolean | null;
}

/** 按可见性策略 + 当前用户登录态,决定是否返回联系方式。
 *  对齐 Prisma `ContactVisibility` 枚举(VERIFIED_ONLY | ALL)。
 *  策略说明:认证不再作为门槛,因此 VERIFIED_ONLY 现意为「仅登录用户可见」
 *  (对齐物品/服务/需求三条线统一的「登录即可见联系方式」策略);ALL 则任何人(含游客)可见。 */
export function resolveContactInfo(ctx: ContactContext): string | null {
  const { visibility, contactInfo, viewerVerified } = ctx;
  if (!contactInfo) return null;
  if (visibility === "ALL") return contactInfo;
  // VERIFIED_ONLY:登录即可见(未登录游客隐藏)
  return viewerVerified !== null ? contactInfo : null;
}
