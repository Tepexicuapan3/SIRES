import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { SessionObserver } from "@/domains/auth-access/components/shared/SessionObserver";
import { clearAuthSession } from "@/domains/auth-access/adapters/auth-cache";
import { subscribeSessionExpired } from "@/domains/auth-access/adapters/session-events";

const { navigateMock, toastErrorMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));
const clearAuthSessionMock = vi.mocked(clearAuthSession);
const subscribeSessionExpiredMock = vi.mocked(subscribeSessionExpired);

let currentPathname = "/dashboard";
let sessionExpiredHandler: (() => void) | null = null;
let unsubscribeMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ pathname: currentPathname }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

vi.mock("@/domains/auth-access/adapters/auth-cache", () => ({
  clearAuthSession: vi.fn(),
}));

vi.mock("@/domains/auth-access/adapters/session-events", () => ({
  subscribeSessionExpired: vi.fn((handler: () => void) => {
    sessionExpiredHandler = handler;
    return unsubscribeMock;
  }),
}));

describe("SessionObserver", () => {
  beforeEach(() => {
    currentPathname = "/dashboard";
    sessionExpiredHandler = null;
    unsubscribeMock = vi.fn();
    navigateMock.mockReset();
    toastErrorMock.mockReset();
    clearAuthSessionMock.mockReset();
    subscribeSessionExpiredMock.mockImplementation((handler: () => void) => {
      sessionExpiredHandler = handler;
      return unsubscribeMock;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fails closed by clearing auth cache before redirecting to login", () => {
    render(<SessionObserver />);

    expect(sessionExpiredHandler).not.toBeNull();
    sessionExpiredHandler?.();

    expect(clearAuthSessionMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });

    const clearOrder = clearAuthSessionMock.mock.invocationCallOrder[0];
    const navigateOrder = navigateMock.mock.invocationCallOrder[0];
    expect(clearOrder).toBeLessThan(navigateOrder);
  });

  it("does not navigate or show toast when already on /login", () => {
    currentPathname = "/login";
    render(<SessionObserver />);

    expect(sessionExpiredHandler).not.toBeNull();
    sessionExpiredHandler?.();

    expect(clearAuthSessionMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = render(<SessionObserver />);
    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
