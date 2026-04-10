import { expect } from "vitest";
import { ApiError } from "@api/utils/errors";

type AuthErrorExpectation = {
  code: string;
  status: number;
  requestId?: "defined" | "optional";
};

export const expectNormalizedAuthApiError = (
  error: unknown,
  expectation: AuthErrorExpectation,
) => {
  expect(error).toBeInstanceOf(ApiError);

  const apiError = error as ApiError;
  expect(apiError.code).toBe(expectation.code);
  expect(apiError.status).toBe(expectation.status);
  expect(typeof apiError.message).toBe("string");
  expect(apiError.message.length).toBeGreaterThan(0);

  if (expectation.requestId === "defined") {
    expect(apiError.requestId).toBeDefined();
  }
};
