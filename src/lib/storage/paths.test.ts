import { describe, it, expect } from "vitest";
import { avatarKey, studentIdKey } from "@/lib/storage/paths";

describe("storage paths", () => {
  it("avatar key is public/<id>/<rand>", () => {
    const k = avatarKey("user_123", "rand");
    expect(k).toBe("public/avatars/user_123/rand");
  });

  it("student-id key is private/<reqId>/<rand>", () => {
    const k = studentIdKey("req_456", "rand");
    expect(k).toBe("private/student-ids/req_456/rand");
  });
});
