import { Role, VerificationStatus } from "@prisma/client";

export interface SessionUser {
  id: string;
  role: Role;
  verificationStatus: VerificationStatus;
}

export class NotAuthenticatedError extends Error {}
export class NotVerifiedError extends Error {}

/** 要求「已登录 + 已认证」,否则抛错。写操作调用方据此返回 401/403。 */
export function requireVerifiedUser(user: SessionUser | null): SessionUser {
  if (!user) throw new NotAuthenticatedError();
  if (user.verificationStatus !== "VERIFIED") throw new NotVerifiedError();
  return user;
}

export function isAdmin(user: Pick<SessionUser, "role"> | null): boolean {
  return user?.role === "ADMIN";
}
