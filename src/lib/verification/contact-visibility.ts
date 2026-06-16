export type ContactVisibility = "VERIFIED_ONLY" | "EVERYONE";

export interface ContactContext {
  visibility: ContactVisibility;
  contactInfo?: string | null;
  /** null = 未登录; true = 已认证; false = 已登录未认证 */
  viewerVerified: boolean | null;
}

/** 按可见性策略 + 当前用户认证态,决定是否返回联系方式 */
export function resolveContactInfo(ctx: ContactContext): string | null {
  const { visibility, contactInfo, viewerVerified } = ctx;
  if (!contactInfo) return null;
  if (visibility === "EVERYONE") return contactInfo;
  // VERIFIED_ONLY
  return viewerVerified === true ? contactInfo : null;
}
