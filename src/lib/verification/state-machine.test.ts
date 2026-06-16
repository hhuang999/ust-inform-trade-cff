import { describe, it, expect } from "vitest";
import {
  canSubmitVerification,
  userStatusAfterReview,
  isValidReview,
} from "@/lib/verification/state-machine";

describe("verification state machine", () => {
  it("allows submit only from UNVERIFIED or REJECTED", () => {
    expect(canSubmitVerification("UNVERIFIED")).toBe(true);
    expect(canSubmitVerification("REJECTED")).toBe(true);
    expect(canSubmitVerification("PENDING")).toBe(false);
    expect(canSubmitVerification("VERIFIED")).toBe(false);
  });

  it("maps review decision to user status", () => {
    expect(userStatusAfterReview("APPROVED")).toBe("VERIFIED");
    expect(userStatusAfterReview("REJECTED")).toBe("REJECTED");
  });

  it("only PENDING requests can be reviewed", () => {
    expect(isValidReview("PENDING", "APPROVED")).toBe(true);
    expect(isValidReview("PENDING", "REJECTED")).toBe(true);
    expect(isValidReview("APPROVED", "REJECTED")).toBe(false);
    expect(isValidReview("REJECTED", "APPROVED")).toBe(false);
  });
});
