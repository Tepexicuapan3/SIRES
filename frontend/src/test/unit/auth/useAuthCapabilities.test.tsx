import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { useAuthCapabilities } from "@/domains/auth-access/hooks/useAuthCapabilities";
import { server } from "@/test/mocks/server";
import { getApiUrl } from "@/test/mocks/urls";
import { setMockSessionUser } from "@/test/mocks/session";
import { createMockAuthUser } from "@/test/factories/users";

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("useAuthCapabilities", () => {
  it("resuelve capacidades desde /auth/capabilities (200)", async () => {
    const capabilities = {
      "admin.users.read": {
        granted: true,
        missingAllOf: [],
        missingAnyOf: [],
      },
    };

    setMockSessionUser(
      createMockAuthUser({
        capabilities,
      }),
    );

    server.use(
      http.get(getApiUrl("auth/capabilities"), () => {
        return HttpResponse.json({ capabilities }, { status: 200 });
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuthCapabilities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasCapability("admin.users.read")).toBe(true);
  });

  it("aplica deny-by-default cuando la capability no existe", async () => {
    server.use(
      http.get(getApiUrl("auth/capabilities"), () => {
        return HttpResponse.json({ capabilities: {} }, { status: 200 });
      }),
    );

    setMockSessionUser(
      createMockAuthUser({
        capabilities: {},
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuthCapabilities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.hasCapability("admin.users.delete")).toBe(false);
  });

  it("expone estado de error para 401", async () => {
    server.use(
      http.get(getApiUrl("auth/capabilities"), () => {
        return HttpResponse.json(
          {
            code: "SESSION_EXPIRED",
            message: "La sesión expiró",
          },
          { status: 401 },
        );
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuthCapabilities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.status).toBe(401);
  });

  it("expone estado de error para 403", async () => {
    let calls = 0;

    server.use(
      http.get(getApiUrl("auth/capabilities"), () => {
        calls += 1;

        return HttpResponse.json(
          {
            code: "PERMISSION_DENIED",
            message: "No autorizado",
          },
          { status: 403 },
        );
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuthCapabilities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.status).toBe(403);
    expect(calls).toBe(1);
  });

  it("reintenta de forma acotada ante 500 transiente", async () => {
    let calls = 0;

    server.use(
      http.get(getApiUrl("auth/capabilities"), () => {
        calls += 1;

        return HttpResponse.json(
          {
            code: "INTERNAL_SERVER_ERROR",
            message: "Error inesperado",
          },
          { status: 500 },
        );
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuthCapabilities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.status).toBe(500);
    expect(calls).toBe(3);
  });

  it("expone estado de red para fallo de network", async () => {
    server.use(
      http.get(getApiUrl("auth/capabilities"), () => {
        return HttpResponse.error();
      }),
    );

    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);
    const { result } = renderHook(() => useAuthCapabilities(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.status).toBe(0);
  });
});
