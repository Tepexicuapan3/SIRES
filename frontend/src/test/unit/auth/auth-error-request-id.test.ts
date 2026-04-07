import type { AxiosInstance } from "axios";
import { describe, expect, it } from "vitest";
import { setupErrorInterceptor } from "@/infrastructure/api/interceptors/error.interceptor";
import { ApiError } from "@/infrastructure/api/utils/errors";

type RejectionHandler = (error: unknown) => Promise<unknown>;

const createInterceptorHarness = () => {
  let onRejected: RejectionHandler | null = null;

  const client = {
    interceptors: {
      response: {
        use: (_onFulfilled: unknown, rejected: RejectionHandler) => {
          onRejected = rejected;
          return 0;
        },
      },
    },
  } as AxiosInstance;

  setupErrorInterceptor(client);

  if (!onRejected) {
    throw new Error("Expected response error interceptor to be registered");
  }

  return onRejected;
};

describe("auth error requestId normalization", () => {
  it("propagates requestId from error payload when request header is unavailable", async () => {
    const onRejected = createInterceptorHarness();

    const error = {
      config: {
        url: "/auth/capabilities",
        headers: {},
      },
      response: {
        status: 500,
        headers: {},
        data: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Error temporal",
          requestId: "req-payload-500",
        },
      },
    };

    await expect(onRejected(error)).rejects.toEqual(
      expect.objectContaining<ApiError>({
        code: "INTERNAL_SERVER_ERROR",
        status: 500,
        requestId: "req-payload-500",
      }),
    );
  });

  it("falls back to X-Request-ID response header when payload omits requestId", async () => {
    const onRejected = createInterceptorHarness();

    const error = {
      config: {
        url: "/auth/capabilities",
        headers: {},
      },
      response: {
        status: 403,
        headers: {
          "x-request-id": "req-header-403",
        },
        data: {
          code: "PERMISSION_DENIED",
          message: "Sin permisos",
        },
      },
    };

    await expect(onRejected(error)).rejects.toEqual(
      expect.objectContaining<ApiError>({
        code: "PERMISSION_DENIED",
        status: 403,
        requestId: "req-header-403",
      }),
    );
  });
});
