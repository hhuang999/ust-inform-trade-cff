import { VerificationStatus } from "@prisma/client";

export type ReviewDecision = "APPROVED" | "REJECTED";

/** 用户当前状态是否允许发起新的认证申请 */
export function canSubmitVerification(status: VerificationStatus): boolean {
  return status === "UNVERIFIED" || status === "REJECTED";
}

/** 审核决定 → 用户状态 */
export function userStatusAfterReview(decision: ReviewDecision): VerificationStatus {
  return decision === "APPROVED" ? "VERIFIED" : "REJECTED";
}

/** 只有 PENDING 的申请可被审核 */
export function isValidReview(reqStatus: string, decision: ReviewDecision): boolean {
  return reqStatus === "PENDING";
}
