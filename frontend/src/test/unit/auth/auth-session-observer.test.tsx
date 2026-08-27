import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { SessionObserver } from "@/domains/auth-access/components/shared/SessionObserver";
import { clearAuthSession } from "@/domains/auth-access/adapters/auth-cache";
import { subscribeSessionExpired } from "@/domains/auth-access/adapters/session-events";
import { authAPI } from "@api/resources/auth.api";
import { queryClient } from "@app/config/query-client";
import { authKeys } from "@/domains/auth-access/state/auth.keys";

const { navigateMock, toastErrorMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));
const clearAuthSessionMock = vi.mocked(clearAuthSession);
const subscribeSessionExpiredMock = vi.mocked(subscribeSessionExpired);

vi.mock("@api/resources/auth.api", () => ({
  authAPI: {
    verifyToken: vi.fn(),
  },
}));
const verifyTokenMock = vi.mocked(authAPI.verifyToken);

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
    verifyTokenMock.mockReset();
    subscribeSessionExpiredMock.mockImplementation((handler: () => void) => {
      sessionExpiredHandler = handler;
      return unsubscribeMock;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.setQueryData(authKeys.session(), null);
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

  describe("heartbeat de inactividad", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      queryClient.setQueryData(authKeys.session(), { id_usuario: 1 });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("renueva el TTL cuando hubo actividad real dentro de la ventana", () => {
      const { unmount } = render(<SessionObserver />);

      window.dispatchEvent(new Event("mousemove"));
      vi.advanceTimersByTime(60_000);

      expect(verifyTokenMock).toHaveBeenCalledTimes(1);
      unmount();
    });

    it("no renueva el TTL si no hubo actividad nueva en la ventana (deja expirar por inactividad)", () => {
      const { unmount } = render(<SessionObserver />);

      // El montaje cuenta como actividad inicial: el primer tick renueva.
      vi.advanceTimersByTime(60_000);
      expect(verifyTokenMock).toHaveBeenCalledTimes(1);

      // Sin ningun evento nuevo, el segundo tick NO debe renovar.
      vi.advanceTimersByTime(60_000);
      expect(verifyTokenMock).toHaveBeenCalledTimes(1);

      unmount();
    });

    it("deja de escuchar eventos de actividad al desmontar", () => {
      const { unmount } = render(<SessionObserver />);
      unmount();

      window.dispatchEvent(new Event("mousemove"));
      vi.advanceTimersByTime(60_000);

      expect(verifyTokenMock).not.toHaveBeenCalled();
    });
  });
});
