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

describe("Auth Recovery Flow (MSW)", () => {
  it("requests a reset code", async () => {
    const response = await authAPI.requestResetCode({
      email: "test@example.com",
    });

    expect(response.success).toBe(true);
  });

  it("returns user not found on invalid email", async () => {
    const promise = authAPI.requestResetCode({
      email: "error@fail.com",
    });

    await expectApiError(promise, { code: "USER_NOT_FOUND", status: 404 });
  });

  it("verifies a valid OTP code", async () => {
    const response = await authAPI.verifyResetCode({
      email: "test@example.com",
      code: "123456",
    });

    expect(response.valid).toBe(true);
  });

  it("rejects expired OTP codes", async () => {
    const promise = authAPI.verifyResetCode({
      email: "test@example.com",
      code: "000000",
    });

    await expectApiError(promise, { code: "CODE_EXPIRED", status: 400 });
  });

  it("rejects OTP codes with too many attempts", async () => {
    const promise = authAPI.verifyResetCode({
      email: "test@example.com",
      code: "999999",
    });

    await expectApiError(promise, { code: "TOO_MANY_ATTEMPTS", status: 429 });
  });

  it("rejects invalid OTP codes", async () => {
    const promise = authAPI.verifyResetCode({
      email: "test@example.com",
      code: "111111",
    });

    await expectApiError(promise, { code: "INVALID_CODE", status: 400 });
  });

  it("resets password with a strong password", async () => {
    const response = await authAPI.resetPassword({
      newPassword: "NewPassword123!",
    });

    expect(response.user).toBeDefined();
    expect(response.user.id).toBeGreaterThan(0);
  });

  it("rejects reset when token is invalid", async () => {
    const promise = authAPI.resetPassword({
      newPassword: "InvalidToken1!",
    });

    await expectApiError(promise, { code: "INVALID_TOKEN", status: 401 });
  });

  it("rejects weak passwords", async () => {
    const promise = authAPI.resetPassword({
      newPassword: "weak",
    });

    await expectApiError(promise, { code: "PASSWORD_TOO_WEAK", status: 400 });
  });
});
