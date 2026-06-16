import { describe, it, expect } from "vitest";
import { resolveContactInfo } from "@/lib/verification/contact-visibility";

describe("resolveContactInfo", () => {
  const info = "wechat: abc123";

  it("EVERYONE: 未登录也能看到", () => {
    expect(resolveContactInfo({ visibility: "EVERYONE", contactInfo: info, viewerVerified: null })).toBe(info);
  });

  it("VERIFIED_ONLY: 未登录看不到", () => {
    expect(resolveContactInfo({ visibility: "VERIFIED_ONLY", contactInfo: info, viewerVerified: null })).toBeNull();
  });

  it("VERIFIED_ONLY: 未认证用户看不到", () => {
    expect(resolveContactInfo({ visibility: "VERIFIED_ONLY", contactInfo: info, viewerVerified: false })).toBeNull();
  });

  it("VERIFIED_ONLY: 已认证用户能看到", () => {
    expect(resolveContactInfo({ visibility: "VERIFIED_ONLY", contactInfo: info, viewerVerified: true })).toBe(info);
  });

  it("无联系方式时始终返回 null", () => {
    expect(resolveContactInfo({ visibility: "EVERYONE", contactInfo: undefined, viewerVerified: true })).toBeNull();
  });
});
