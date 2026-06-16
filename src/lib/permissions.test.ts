import { describe, it, expect } from "vitest";
import {
  requireVerifiedUser,
  NotAuthenticatedError,
  NotVerifiedError,
  isAdmin,
} from "@/lib/permissions";

type U = { id: string; verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED"; role: "USER" | "ADMIN" };

describe("permissions", () => {
  it("throws NotAuthenticatedError when no user", () => {
    expect(() => requireVerifiedUser(null)).toThrow(NotAuthenticatedError);
  });

  it("throws NotVerifiedError when not VERIFIED", () => {
    const u: U = { id: "1", verificationStatus: "UNVERIFIED", role: "USER" };
    expect(() => requireVerifiedUser(u)).toThrow(NotVerifiedError);
    u.verificationStatus = "PENDING";
    expect(() => requireVerifiedUser(u)).toThrow(NotVerifiedError);
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
