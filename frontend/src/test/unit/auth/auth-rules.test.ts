import { describe, it, expect } from "vitest";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  PASSWORD_REQUIREMENTS,
  getPasswordRequirementStatus,
  isPasswordStrong,
  obfuscateEmail,
} from "@/features/auth/domain/auth.rules";

describe("auth rules", () => {
  it("exposes OTP constants used by UI", () => {
    expect(OTP_LENGTH).toBe(6);
    expect(OTP_MAX_ATTEMPTS).toBe(3);
  });

  it("evaluates password strength using all requirements", () => {
    expect(isPasswordStrong("SecurePass123!")).toBe(true);
    expect(isPasswordStrong("weakpass")).toBe(false);
  });

  it("returns requirement status for each password rule", () => {
    const results = getPasswordRequirementStatus("SecurePass123!");

    expect(results).toHaveLength(PASSWORD_REQUIREMENTS.length);
    expect(results.every((item) => item.isMet)).toBe(true);
  });

  it("obfuscates email addresses for display", () => {
    const masked = obfuscateEmail("john.doe@example.com");
    const expectedMask = "\u2022".repeat(6);

    expect(masked).toBe(`jo${expectedMask}@example.com`);
  });
});
