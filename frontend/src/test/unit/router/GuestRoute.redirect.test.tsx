import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { GuestRoute } from "@/app/router/guards/GuestRoute";
import { useAuthSession } from "@/domains/auth-access/hooks/useAuthSession";

const { navigateRenderSpy } = vi.hoisted(() => ({
  navigateRenderSpy: vi.fn<(args: { to: string; replace?: boolean }) => void>(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );

  return {
    ...actual,
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
      navigateRenderSpy({ to, replace });
      return <actual.Navigate to={to} replace={replace} />;
    },
  };
});

vi.mock("@/domains/auth-access/hooks/useAuthSession", () => ({
  useAuthSession: vi.fn(),
}));

const renderGuestRoute = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <div>guest login page</div>
            </GuestRoute>
          }
        />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
        <Route path="/onboarding" element={<div>onboarding page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("GuestRoute redirect behavior", () => {
  beforeEach(() => {
    (useAuthSession as unknown as Mock).mockReset();
    navigateRenderSpy.mockReset();
  });

  it("redirects authenticated users exactly once away from /login and does not render guest content", () => {
    (useAuthSession as unknown as Mock).mockReturnValue({
      data: {
        id: 1,
        username: "admin",
        requiresOnboarding: false,
        mustChangePassword: false,
        landingRoute: "/dashboard",
      },
      isLoading: false,
    });

    renderGuestRoute();

    expect(navigateRenderSpy).toHaveBeenCalledTimes(1);
    expect(navigateRenderSpy).toHaveBeenCalledWith({
      to: "/dashboard",
      replace: true,
    });
    expect(screen.getByText("dashboard page")).toBeInTheDocument();
    expect(screen.queryByText("guest login page")).not.toBeInTheDocument();
  });

  it("keeps unauthenticated users on guest route", () => {
    (useAuthSession as unknown as Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderGuestRoute();

    expect(screen.getByText("guest login page")).toBeInTheDocument();
    expect(screen.queryByText("dashboard page")).not.toBeInTheDocument();
  });
});
