// @vitest-environment node
import { describe, it, expect } from "vitest";
import { authAPI } from "@/api/resources/auth.api";
import { ApiError } from "@/api/utils/errors";

type ErrorExpectation = {
  code: string;
  status: number;
};

const expectApiError = async (
  promise: Promise<unknown>,
  expectation: ErrorExpectation,
) => {
  await expect(promise).rejects.toBeInstanceOf(ApiError);
  await expect(promise).rejects.toMatchObject(expectation);
};

describe("Auth Onboarding Flow (MSW)", () => {
  it("completes onboarding with valid data", async () => {
    const response = await authAPI.completeOnboarding({
      newPassword: "SecurePass123!",
      termsAccepted: true,
    });

    expect(response.user).toBeDefined();
    expect(response.user.mustChangePassword).toBe(false);
    expect(response.requiresOnboarding).toBe(false);
  });

  it("rejects onboarding when terms are not accepted", async () => {
    const promise = authAPI.completeOnboarding({
      newPassword: "SecurePass123!",
      termsAccepted: false,
    });

    await expectApiError(promise, { code: "TERMS_NOT_ACCEPTED", status: 400 });
  });

  it("rejects weak passwords", async () => {
    const promise = authAPI.completeOnboarding({
      newPassword: "weak",
      termsAccepted: true,
    });

    await expectApiError(promise, { code: "PASSWORD_TOO_WEAK", status: 400 });
  });

  it("handles onboarding server failures", async () => {
    const promise = authAPI.completeOnboarding({
      newPassword: "InvalidToken1!",
      termsAccepted: true,
    });

    await expectApiError(promise, { code: "ONBOARDING_FAILED", status: 500 });
  });
});
