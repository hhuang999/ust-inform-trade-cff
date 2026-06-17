import { Role, VerificationStatus } from "@prisma/client";

export interface SessionUser {
  id: string;
  role: Role;
  verificationStatus: VerificationStatus;
}

export class NotAuthenticatedError extends Error {}
export class NotVerifiedError extends Error {}

/** 要求「已登录」即可。认证(VERIFIED)不再作为访问门槛——未认证用户与已认证用户
 *  拥有几乎相同的权限,仅缺少「已认证」信任徽章。认证现仅作为信任信号(展示/排序/意向人列表),
 *  不再阻止发布、应征、预约、收藏、查看联系方式等任何功能。
 *  未登录仍抛 NotAuthenticatedError(各调用方据此跳转 /login)。
 *  NotVerifiedError 保留导出以兼容历史 catch 类型,但本函数不再抛出。 */
export function requireVerifiedUser(user: SessionUser | null): SessionUser {
  if (!user) throw new NotAuthenticatedError();
  return user;
}

export function isAdmin(user: Pick<SessionUser, "role"> | null): boolean {
  return user?.role === "ADMIN";
}
