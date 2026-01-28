// @vitest-environment node
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { authAPI } from "@/api/resources/auth.api";
import { ApiError } from "@/api/utils/errors";
import { server } from "@/test/mocks/server";

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

describe("Auth Login Flow (MSW)", () => {
  it("logs in successfully with a standard user", async () => {
    const response = await authAPI.login({
      username: "test_user",
      password: "password123",
    });

    expect(response.user).toBeDefined();
    expect(response.user.id).toBeGreaterThan(0);
    expect(response.user.username).toBe("test_user");
    expect(response.requiresOnboarding).toBe(false);
  });

  it("flags onboarding for new users", async () => {
    const response = await authAPI.login({
      username: "newuser",
      password: "password123",
    });

    expect(response.requiresOnboarding).toBe(true);
    expect(response.user.mustChangePassword).toBe(true);
  });

  it.each([
    {
      username: "error",
      password: "password123",
      code: "INVALID_CREDENTIALS",
      status: 401,
    },
    {
      username: "test_user",
      password: "wrong",
      code: "INVALID_CREDENTIALS",
      status: 401,
    },
    {
      username: "locked",
      password: "password123",
      code: "USER_LOCKED",
      status: 423,
    },
    {
      username: "inactive",
      password: "password123",
      code: "USER_INACTIVE",
      status: 403,
    },
    {
      username: "expired",
      password: "password123",
      code: "ACCOUNT_EXPIRED",
      status: 401,
    },
    {
      username: "maintenance",
      password: "password123",
      code: "SERVICE_UNAVAILABLE",
      status: 503,
    },
    {
      username: "broken",
      password: "password123",
      code: "SERVER_ERROR",
      status: 500,
    },
  ])(
    "rejects login for $username",
    async ({ username, password, code, status }) => {
      const promise = authAPI.login({ username, password });
      await expectApiError(promise, { code, status });
    },
  );

  it("returns current user profile", async () => {
    const response = await authAPI.getCurrentUser();

    expect(response).toBeDefined();
    expect(response.id).toBeGreaterThan(0);
    expect(response.username).toBeTruthy();
    expect(Array.isArray(response.roles)).toBe(true);
  });

  it("refreshes the session token", async () => {
    const response = await authAPI.refreshToken();

    expect(response.success).toBe(true);
  });

  it("verifies token validity", async () => {
    const response = await authAPI.verifyToken();

    expect(response.valid).toBe(true);
  });

  it("returns invalid token on 401/403", async () => {
    server.use(
      http.get("*/auth/verify", () => {
        return HttpResponse.json(
          { code: "PERMISSION_DENIED" },
          { status: 403 },
        );
      }),
    );

    const response = await authAPI.verifyToken();

    expect(response.valid).toBe(false);
  });

  it("logs out successfully", async () => {
    const response = await authAPI.logout();

    expect(response.success).toBe(true);
  });
});
