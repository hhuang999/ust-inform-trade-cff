import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validation/user";

describe("user validation", () => {
  it("register requires at least one of email/phone", () => {
    expect(
      registerSchema.safeParse({
        email: "a@b.com", phone: undefined, password: "123456",
        realName: "张三", studentId: "S1", department: "CS", enrollmentYear: 2024, nickname: "san",
      }).success
    ).toBe(true);

    expect(
      registerSchema.safeParse({
        email: undefined, phone: undefined, password: "123456",
        realName: "张三", studentId: "S1", department: "CS", enrollmentYear: 2024, nickname: "san",
      }).success
    ).toBe(false);
  });

  it("login requires identifier + password", () => {
    expect(loginSchema.safeParse({ identifier: "a@b.com", password: "123456" }).success).toBe(true);
    expect(loginSchema.safeParse({ identifier: "", password: "" }).success).toBe(false);
  });
});
