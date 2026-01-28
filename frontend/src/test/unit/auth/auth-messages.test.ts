import { describe, it, expect } from "vitest";
import { ERROR_CODES, ERROR_MESSAGES } from "@/api/utils/errors";
import {
  getAuthErrorMessage,
  loginErrorMessages,
  onboardingErrorMessages,
  recoveryErrorMessages,
} from "@/features/auth/domain/auth.messages";

describe("auth messages", () => {
  it("maps login error codes to global messages", () => {
    expect(loginErrorMessages[ERROR_CODES.INVALID_CREDENTIALS]).toBe(
      ERROR_MESSAGES[ERROR_CODES.INVALID_CREDENTIALS],
    );
  });

  it("maps onboarding error codes to global messages", () => {
    expect(onboardingErrorMessages[ERROR_CODES.PASSWORD_TOO_WEAK]).toBe(
      ERROR_MESSAGES[ERROR_CODES.PASSWORD_TOO_WEAK],
    );
  });

  it("maps recovery error codes to global messages", () => {
    expect(recoveryErrorMessages[ERROR_CODES.USER_NOT_FOUND]).toBe(
      ERROR_MESSAGES[ERROR_CODES.USER_NOT_FOUND],
    );
  });

  it("returns undefined for unknown error codes", () => {
    expect(
      getAuthErrorMessage(loginErrorMessages, "UNKNOWN_CODE"),
    ).toBeUndefined();
    expect(getAuthErrorMessage(loginErrorMessages, undefined)).toBeUndefined();
  });
});
