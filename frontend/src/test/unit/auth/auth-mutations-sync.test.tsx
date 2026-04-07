import { describe, expect, it, vi, beforeEach } from "vitest";

const navigateMock = vi.fn();
const useMutationMock = vi.fn((options: unknown) => options);
const useQueryClientMock = vi.fn();
const invalidateAuthSessionAndCapabilitiesMock = vi.fn();
const setAuthSessionMock = vi.fn();
const clearAuthSessionMock = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: unknown) => useMutationMock(options),
  useQueryClient: () => useQueryClientMock(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    promise: vi.fn(),
  },
}));

vi.mock("@api/resources/auth.api", () => ({
  authAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

vi.mock("@/domains/auth-access/adapters/auth-query-invalidation", () => ({
  invalidateAuthSessionAndCapabilities: (queryClient: unknown) =>
    invalidateAuthSessionAndCapabilitiesMock(queryClient),
}));

vi.mock("@/domains/auth-access/adapters/auth-cache", () => ({
  setAuthSession: (...args: unknown[]) => setAuthSessionMock(...args),
  clearAuthSession: (...args: unknown[]) => clearAuthSessionMock(...args),
}));

vi.mock("@app/state/ui/sidebarStore", () => ({
  useSidebarStore: {
    getState: () => ({
      resetSidebarState: vi.fn(),
    }),
  },
}));

vi.mock("@app/state/ui/themeStore", () => ({
  useThemeStore: {
    getState: () => ({
      resetTheme: vi.fn(),
    }),
  },
}));

import { useLogin } from "@/domains/auth-access/hooks/useLogin";
import { useLogout } from "@/domains/auth-access/hooks/useLogout";
import { useRefreshSession } from "@/domains/auth-access/hooks/useRefreshSession";

describe("auth mutations sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({
      cancelQueries: vi.fn(),
      clear: vi.fn(),
    });
  });

  it("invalidates session+capabilities after successful login", () => {
    const queryClient = {
      cancelQueries: vi.fn(),
      clear: vi.fn(),
    };
    useQueryClientMock.mockReturnValue(queryClient);

    const mutation = useLogin() as { onSuccess?: (...args: unknown[]) => void };

    mutation.onSuccess?.(
      {
        user: {
          fullName: "Admin User",
          landingRoute: "/admin",
        },
        requiresOnboarding: false,
      },
      {
        username: "admin",
        password: "secret",
        rememberMe: false,
      },
    );

    expect(setAuthSessionMock).toHaveBeenCalledWith(
      queryClient,
      expect.objectContaining({ fullName: "Admin User" }),
    );
    expect(invalidateAuthSessionAndCapabilitiesMock).toHaveBeenCalledWith(
      queryClient,
    );
  });

  it("invalidates session+capabilities after successful refresh", () => {
    const queryClient = {
      cancelQueries: vi.fn(),
      clear: vi.fn(),
    };
    useQueryClientMock.mockReturnValue(queryClient);

    const mutation = useRefreshSession() as {
      onSuccess?: (...args: unknown[]) => void;
    };

    mutation.onSuccess?.();

    expect(invalidateAuthSessionAndCapabilitiesMock).toHaveBeenCalledWith(
      queryClient,
    );
  });

  it("clears auth caches on logout success", () => {
    const queryClient = {
      cancelQueries: vi.fn(),
      clear: vi.fn(),
    };
    useQueryClientMock.mockReturnValue(queryClient);

    const mutation = useLogout() as {
      onSuccess?: (...args: unknown[]) => void;
    };
    mutation.onSuccess?.();

    expect(clearAuthSessionMock).toHaveBeenCalledWith(queryClient);
  });
});
