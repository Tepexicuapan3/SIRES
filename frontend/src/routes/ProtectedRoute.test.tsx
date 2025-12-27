import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuthStore } from "@store/authStore";

/**
 * Helper para renderizar con react-router-dom
 */
const renderWithRouter = (
  ui: React.ReactElement,
  { initialPath = "/", ...options } = {},
) => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>{ui}</MemoryRouter>,
    options,
  );
};

describe("ProtectedRoute", () => {
  beforeEach(() => {
    // Limpiar store antes de cada test
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  describe("Autenticación básica", () => {
    it("debería redirigir a /login si no está autenticado", () => {
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Protegido</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>,
        { initialPath: "/dashboard" },
      );

      // Debería mostrar la página de login
      expect(screen.getByText("Login Page")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard Protegido")).not.toBeInTheDocument();
    });

    it("debería renderizar children si está autenticado", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_MEDICO"],
          must_change_password: false,
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Protegido</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialPath: "/dashboard" },
      );

      expect(screen.getByText("Dashboard Protegido")).toBeInTheDocument();
    });
  });

  describe("Flujo de Onboarding", () => {
    it("debería redirigir a /onboarding si must_change_password es true", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "new_user",
          nombre: "New User",
          roles: ["ROL_MEDICO"],
          must_change_password: true, // Usuario nuevo
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Protegido</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>,
        { initialPath: "/dashboard" },
      );

      // Debería redirigir al onboarding
      expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
      expect(screen.queryByText("Dashboard Protegido")).not.toBeInTheDocument();
    });

    it("debería permitir acceso a /onboarding si must_change_password es true", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "new_user",
          nombre: "New User",
          roles: ["ROL_MEDICO"],
          must_change_password: true,
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <div>Onboarding Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialPath: "/onboarding" },
      );

      // Debería mostrar el onboarding
      expect(screen.getByText("Onboarding Content")).toBeInTheDocument();
    });

    it("debería redirigir a /dashboard si ya completó onboarding y intenta volver", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_MEDICO"],
          must_change_password: false, // Ya completó onboarding
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <div>Onboarding Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>,
        { initialPath: "/onboarding" },
      );

      // Debería redirigir al dashboard
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
      expect(screen.queryByText("Onboarding Content")).not.toBeInTheDocument();
    });
  });

  describe("Verificación de Roles", () => {
    it("debería mostrar error si no tiene el rol requerido", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_ENFERMERO"], // NO tiene ROL_MEDICO
          must_change_password: false,
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/expedientes"
            element={
              <ProtectedRoute requiredRole="ROL_MEDICO">
                <div>Expedientes Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialPath: "/expedientes" },
      );

      // Debería mostrar mensaje de acceso denegado
      expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
      expect(
        screen.getByText("No tienes permisos para acceder a esta página"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Expedientes Page")).not.toBeInTheDocument();
    });

    it("debería permitir acceso si tiene el rol requerido", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_MEDICO", "ROL_ADMIN"], // Tiene ROL_MEDICO
          must_change_password: false,
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/expedientes"
            element={
              <ProtectedRoute requiredRole="ROL_MEDICO">
                <div>Expedientes Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialPath: "/expedientes" },
      );

      // Debería mostrar la página protegida
      expect(screen.getByText("Expedientes Page")).toBeInTheDocument();
      expect(screen.queryByText("Acceso Denegado")).not.toBeInTheDocument();
    });

    it("debería permitir acceso si no requiere rol específico", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_CUALQUIERA"],
          must_change_password: false,
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                {/* Sin requiredRole */}
                <div>Dashboard General</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialPath: "/dashboard" },
      );

      // Debería mostrar la página (cualquier usuario autenticado)
      expect(screen.getByText("Dashboard General")).toBeInTheDocument();
    });
  });

  describe("Escenarios combinados", () => {
    it("debería priorizar onboarding sobre verificación de roles", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "new_user",
          nombre: "New User",
          roles: ["ROL_MEDICO"], // Tiene el rol
          must_change_password: true, // Pero debe completar onboarding
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/expedientes"
            element={
              <ProtectedRoute requiredRole="ROL_MEDICO">
                <div>Expedientes Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/onboarding" element={<div>Onboarding Page</div>} />
        </Routes>,
        { initialPath: "/expedientes" },
      );

      // Debería redirigir al onboarding (tiene prioridad)
      expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
      expect(screen.queryByText("Expedientes Page")).not.toBeInTheDocument();
    });

    it("debería verificar roles después de completar onboarding", () => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_ENFERMERO"], // NO tiene ROL_MEDICO
          must_change_password: false, // Ya completó onboarding
        },
      });

      renderWithRouter(
        <Routes>
          <Route
            path="/expedientes"
            element={
              <ProtectedRoute requiredRole="ROL_MEDICO">
                <div>Expedientes Page</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        { initialPath: "/expedientes" },
      );

      // Debería mostrar acceso denegado por falta de rol
      expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
      expect(screen.queryByText("Expedientes Page")).not.toBeInTheDocument();
    });
  });
});
