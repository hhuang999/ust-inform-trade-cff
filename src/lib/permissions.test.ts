import { describe, it, expect } from "vitest";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  isAdmin,
} from "@/lib/permissions";

type U = { id: string; verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"; role: "USER" | "ADMIN" };

describe("permissions", () => {
  it("throws NotAuthenticatedError when no user", () => {
    expect(() => requireVerifiedUser(null)).toThrow(NotAuthenticatedError);
  });

  // 认证自 2026-06-18 起不再作为访问门槛:未认证用户也能用(仅缺徽章)。
  it("returns the user even when not VERIFIED (login-only policy)", () => {
    const u: U = { id: "1", verificationStatus: "UNVERIFIED", role: "USER" };
    expect(requireVerifiedUser(u)).toBe(u);
    u.verificationStatus = "PENDING";
    expect(requireVerifiedUser(u)).toBe(u);
  });

  it("returns the user when VERIFIED", () => {
    const u: U = { id: "1", verificationStatus: "VERIFIED", role: "USER" };
    expect(requireVerifiedUser(u)).toBe(u);
  });

  it("isAdmin checks role", () => {
    expect(isAdmin({ role: "ADMIN" } as U)).toBe(true);
    expect(isAdmin({ role: "USER" } as U)).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});
