import { isValidElement, type ReactElement } from "react";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/app/router/guards/ProtectedRoute";
import { adminRoutes } from "@/app/router/modules/admin.routes.config";
import { useAuthSession } from "@/domains/auth-access/hooks/useAuthSession";
import { usePermissions } from "@/domains/auth-access/hooks/usePermissions";
import { usePermissionDependencies } from "@/domains/auth-access/hooks/usePermissionDependencies";
import { useAuthCapabilities } from "@/domains/auth-access/hooks/useAuthCapabilities";

vi.mock("@/domains/auth-access/hooks/useAuthSession", () => ({
  useAuthSession: vi.fn(),
}));

vi.mock("@/domains/auth-access/hooks/usePermissions", () => ({
  usePermissions: vi.fn(),
}));

vi.mock("@/domains/auth-access/hooks/usePermissionDependencies", () => ({
  usePermissionDependencies: vi.fn(),
}));

vi.mock("@/domains/auth-access/hooks/useAuthCapabilities", () => ({
  useAuthCapabilities: vi.fn(),
}));

interface ProtectedRouteElementProps {
  requiredCapability?: string;
  requiredPermission?: string;
}

const renderGuard = (options?: { requiredPermission?: string }) => {
  return render(
    <MemoryRouter initialEntries={["/admin/usuarios"]}>
      <Routes>
        <Route
          path="/admin/usuarios"
          element={
            <ProtectedRoute
              requiredCapability="admin.users.read"
              requiredPermission={options?.requiredPermission}
            >
              <div>admin users page</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
};

describe("ProtectedRoute capability-first", () => {
  beforeEach(() => {
    (useAuthSession as unknown as Mock).mockReturnValue({
      data: {
        id: 1,
        requiresOnboarding: false,
      },
      isLoading: false,
    });

    (usePermissions as unknown as Mock).mockReturnValue({
      hasPermission: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
    });

    (usePermissionDependencies as unknown as Mock).mockReturnValue({
      hasCapability: vi.fn(() => false),
      hasEffectivePermission: vi.fn(() => false),
      hasEffectiveRequirement: vi.fn(() => false),
    });

    (useAuthCapabilities as unknown as Mock).mockReturnValue({
      hasCapability: vi.fn(() => false),
      isLoading: false,
      isError: false,
    });
  });

  it("allow: renderiza children cuando capability está granted", () => {
    (useAuthCapabilities as unknown as Mock).mockReturnValue({
      hasCapability: vi.fn(() => true),
      isLoading: false,
      isError: false,
    });

    renderGuard();

    expect(screen.getByText("admin users page")).toBeInTheDocument();
  });

  it("deny: bloquea cuando capability está denied", () => {
    renderGuard();

    expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
  });

  it("deny: capability deny prevalece aunque legacy permission permita", () => {
    (usePermissions as unknown as Mock).mockReturnValue({
      hasPermission: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
    });

    (useAuthCapabilities as unknown as Mock).mockReturnValue({
      hasCapability: vi.fn(() => false),
      isLoading: false,
      isError: false,
    });

    renderGuard({ requiredPermission: "ADMIN" });

    expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
  });

  it("loading: muestra spinner seguro mientras capabilities resuelve", () => {
    (useAuthCapabilities as unknown as Mock).mockReturnValue({
      hasCapability: vi.fn(() => false),
      isLoading: true,
      isError: false,
    });

    renderGuard();

    expect(
      screen.getByRole("status", { name: /loading/i }),
    ).toBeInTheDocument();
  });

  it("error: fail-closed aunque fallback legacy permitiría acceso", () => {
    (useAuthCapabilities as unknown as Mock).mockReturnValue({
      hasCapability: vi.fn(() => true),
      isLoading: false,
      isError: true,
    });

    renderGuard();

    expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
  });
});

describe("admin routes config capability wiring", () => {
  it("usuarios y roles usan requiredCapability en flujo crítico", () => {
    const usersRoute = adminRoutes.find((route) => route.path === "usuarios");
    const rolesRoute = adminRoutes.find((route) => route.path === "roles");

    expect(usersRoute?.element).toBeDefined();
    expect(rolesRoute?.element).toBeDefined();

    expect(isValidElement(usersRoute?.element)).toBe(true);
    expect(isValidElement(rolesRoute?.element)).toBe(true);

    const usersElement =
      usersRoute?.element as ReactElement<ProtectedRouteElementProps>;
    const rolesElement =
      rolesRoute?.element as ReactElement<ProtectedRouteElementProps>;

    expect(usersElement.props.requiredCapability).toBe("admin.users.read");
    expect(rolesElement.props.requiredCapability).toBe("admin.roles.read");
  });
});
