import { describe, expect, it } from "vitest";
import {
  ApiError,
  ERROR_CODES,
  isExpectedAuthErrorForTelemetry,
} from "@api/utils/errors";

describe("auth telemetry error classification", () => {
  it("classifies expected auth 401 errors", () => {
    const error = new ApiError(
      ERROR_CODES.SESSION_EXPIRED,
      "Sesion expirada",
      401,
    );

    expect(isExpectedAuthErrorForTelemetry(error)).toBe(true);
  });

  it("does not classify non-auth unexpected errors", () => {
    const error = new ApiError(
      ERROR_CODES.INTERNAL_SERVER_ERROR,
      "Error del servidor",
      500,
    );

    expect(isExpectedAuthErrorForTelemetry(error)).toBe(false);
  });
});
