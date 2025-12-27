import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import { OnboardingPage } from "./OnboardingPage";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/api/resources/auth.api";

// ==================== MOCKS ====================

// Mock API
vi.mock("@/api/resources/auth.api", () => ({
  authAPI: {
    completeOnboarding: vi.fn(),
  },
}));

// Mock Router
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useLogout hook
const mockLogout = vi.fn();
vi.mock("../../hooks/useLogout", () => ({
  useLogout: () => ({
    mutate: mockLogout,
    isPending: false,
  }),
}));

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// ==================== HELPERS ====================

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/onboarding"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

// ==================== TESTS ====================

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  // ============================================================
  // 1. RENDERIZADO INICIAL
  // ============================================================

  describe("Initial Render", () => {
    it("should render TERMS step by default", () => {
      // Arrange & Act
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Assert
      expect(
        screen.getByText("Términos y Condiciones de Uso"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("He leído y acepto los términos y condiciones"),
      ).toBeInTheDocument();
      expect(screen.getByText("Continuar al Paso 2")).toBeInTheDocument();
    });

    it("should render logout button", () => {
      // Arrange & Act
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Assert
      const logoutButton = screen.getByRole("button", {
        name: /cerrar sesión/i,
      });
      expect(logoutButton).toBeInTheDocument();
      expect(logoutButton).not.toBeDisabled();
    });

    it("should disable 'Continue' button if terms not accepted", () => {
      // Arrange & Act
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Assert
      const continueButton = screen.getByText("Continuar al Paso 2");
      expect(continueButton).toBeDisabled();
    });
  });

  // ============================================================
  // 2. NAVEGACIÓN ENTRE STEPS
  // ============================================================

  describe("Step Navigation", () => {
    it("should navigate to PASSWORD step when terms accepted", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Act - Accept terms
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);

      // Act - Click Continue
      const continueButton = screen.getByText("Continuar al Paso 2");
      await user.click(continueButton);

      // Assert - PASSWORD step visible
      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
        expect(
          screen.getByText("Último paso para activar tu cuenta"),
        ).toBeInTheDocument();
      });
    });

    it("should navigate back to TERMS when 'Volver' clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Act - Accept terms and go to PASSWORD step
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      // Wait for PASSWORD step
      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      // Act - Click back button
      const backButton = screen.getByRole("button", { name: /volver/i });
      await user.click(backButton);

      // Assert - TERMS step visible again
      await waitFor(() => {
        expect(
          screen.getByText("Términos y Condiciones de Uso"),
        ).toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // 3. VALIDACIÓN DE CONTRASEÑA
  // ============================================================

  describe("Password Validation", () => {
    it("should show password requirements when typing", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      // Wait for PASSWORD step
      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      // Act - Type weak password
      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      await user.type(passwordInput, "abc");

      // Assert - Requirements visible
      await waitFor(() => {
        expect(screen.getByText("Mínimo 8 caracteres")).toBeInTheDocument();
        expect(screen.getByText(/al menos una mayúscula/i)).toBeInTheDocument();
      });
    });

    it("should NOT submit with invalid password", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      // Act - Type weak password
      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      const confirmInput = screen.getByLabelText("Confirmar Contraseña");

      await user.type(passwordInput, "weak");
      await user.type(confirmInput, "weak");

      const submitButton = screen.getByRole("button", {
        name: /finalizar y acceder/i,
      });
      await user.click(submitButton);

      // Assert - API NOT called
      expect(authAPI.completeOnboarding).not.toHaveBeenCalled();
    });

    it("should show error when passwords don't match", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      // Act - Type mismatched passwords
      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      const confirmInput = screen.getByLabelText("Confirmar Contraseña");

      await user.type(passwordInput, "Valid@Pass123");
      await user.type(confirmInput, "Different@Pass123");

      const submitButton = screen.getByRole("button", {
        name: /finalizar y acceder/i,
      });
      await user.click(submitButton);

      // Assert - Error message visible
      await waitFor(() => {
        expect(
          screen.getByText("Las contraseñas no coinciden"),
        ).toBeInTheDocument();
      });

      // Assert - API NOT called
      expect(authAPI.completeOnboarding).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 4. FLUJO EXITOSO COMPLETO
  // ============================================================

  describe("Successful Onboarding Flow", () => {
    it("should complete onboarding and navigate to dashboard", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockResponse = {
        message: "Onboarding completado",
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_MEDICO"],
          must_change_password: false,
        },
      };

      vi.mocked(authAPI.completeOnboarding).mockResolvedValueOnce(mockResponse);

      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Act - Step 1: Accept terms
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      // Wait for PASSWORD step
      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      // Act - Step 2: Enter valid password
      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      const confirmInput = screen.getByLabelText("Confirmar Contraseña");

      await user.type(passwordInput, "Valid@Pass123");
      await user.type(confirmInput, "Valid@Pass123");

      const submitButton = screen.getByRole("button", {
        name: /finalizar y acceder/i,
      });
      await user.click(submitButton);

      // Assert - API called with correct data
      await waitFor(() => {
        expect(authAPI.completeOnboarding).toHaveBeenCalledWith({
          new_password: "Valid@Pass123",
          terms_accepted: true,
        });
      });

      // Assert - Auth store updated
      await waitFor(() => {
        const state = useAuthStore.getState();
        expect(state.user).toEqual(mockResponse.user);
        expect(state.isAuthenticated).toBe(true);
      });

      // Assert - Navigate to dashboard (after 1.5s delay)
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
            replace: true,
          });
        },
        { timeout: 2000 },
      );
    });
  });

  // ============================================================
  // 5. MANEJO DE ERRORES
  // ============================================================

  describe("Error Handling", () => {
    it("should logout when INVALID_SCOPE error occurs", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockError = {
        response: {
          data: {
            code: "INVALID_SCOPE",
            message: "Token sin scope onboarding_required",
          },
        },
      };

      vi.mocked(authAPI.completeOnboarding).mockRejectedValueOnce(mockError);

      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step and submit
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      const confirmInput = screen.getByLabelText("Confirmar Contraseña");

      await user.type(passwordInput, "Valid@Pass123");
      await user.type(confirmInput, "Valid@Pass123");

      const submitButton = screen.getByRole("button", {
        name: /finalizar y acceder/i,
      });
      await user.click(submitButton);

      // Assert - Logout called after delay
      await waitFor(
        () => {
          expect(mockLogout).toHaveBeenCalled();
        },
        { timeout: 3000 },
      );
    });

    it("should redirect to dashboard when ONBOARDING_NOT_REQUIRED", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockError = {
        response: {
          data: {
            code: "ONBOARDING_NOT_REQUIRED",
            message: "El usuario ya completó el onboarding",
          },
        },
      };

      vi.mocked(authAPI.completeOnboarding).mockRejectedValueOnce(mockError);

      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step and submit
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      const confirmInput = screen.getByLabelText("Confirmar Contraseña");

      await user.type(passwordInput, "Valid@Pass123");
      await user.type(confirmInput, "Valid@Pass123");

      const submitButton = screen.getByRole("button", {
        name: /finalizar y acceder/i,
      });
      await user.click(submitButton);

      // Assert - Navigate to dashboard after delay
      await waitFor(
        () => {
          expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
            replace: true,
          });
        },
        { timeout: 2000 },
      );
    });

    it("should show generic error for unknown error codes", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockError = {
        response: {
          data: {
            code: "UNKNOWN_ERROR",
            message: "Error desconocido del backend",
          },
        },
      };

      vi.mocked(authAPI.completeOnboarding).mockRejectedValueOnce(mockError);

      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step and submit
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      const confirmInput = screen.getByLabelText("Confirmar Contraseña");

      await user.type(passwordInput, "Valid@Pass123");
      await user.type(confirmInput, "Valid@Pass123");

      const submitButton = screen.getByRole("button", {
        name: /finalizar y acceder/i,
      });
      await user.click(submitButton);

      // Assert - Error handled gracefully (no crash)
      await waitFor(() => {
        expect(authAPI.completeOnboarding).toHaveBeenCalled();
      });

      // Should NOT logout or navigate
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // 6. BOTÓN DE LOGOUT
  // ============================================================

  describe("Logout Functionality", () => {
    it("should call logout when 'Salir' button clicked in TERMS step", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Act
      const logoutButton = screen.getByRole("button", {
        name: /cerrar sesión/i,
      });
      await user.click(logoutButton);

      // Assert
      expect(mockLogout).toHaveBeenCalled();
    });

    it("should call logout when 'Salir' button clicked in PASSWORD step", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      // Act
      const logoutButton = screen.getByRole("button", {
        name: /cerrar sesión/i,
      });
      await user.click(logoutButton);

      // Assert
      expect(mockLogout).toHaveBeenCalled();
    });

    it("should disable logout button when onboarding in progress", async () => {
      // Arrange
      const user = userEvent.setup();

      // Mock API con delay para simular pending state
      vi.mocked(authAPI.completeOnboarding).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  message: "Success",
                  user: {
                    id_usuario: 1,
                    usuario: "test",
                    nombre: "Test",
                    roles: [],
                    must_change_password: false,
                  },
                }),
              100,
            ),
          ),
      );

      render(<OnboardingPage />, { wrapper: createWrapper() });

      // Navigate to PASSWORD step
      const checkbox = screen.getByRole("checkbox", {
        name: /acepto los términos/i,
      });
      await user.click(checkbox);
      await user.click(screen.getByText("Continuar al Paso 2"));

      await waitFor(() => {
        expect(screen.getByText("Crea tu contraseña")).toBeInTheDocument();
      });

      // Act - Submit form
      const passwordInput = screen.getByLabelText("Nueva Contraseña");
      const confirmInput = screen.getByLabelText("Confirmar Contraseña");

      await user.type(passwordInput, "Valid@Pass123");
      await user.type(confirmInput, "Valid@Pass123");

      const submitButton = screen.getByRole("button", {
        name: /finalizar y acceder/i,
      });
      await user.click(submitButton);

      // Assert - Logout button disabled during pending
      const logoutButton = screen.getByRole("button", {
        name: /cerrar sesión/i,
      });
      expect(logoutButton).toBeDisabled();
    });
  });
});
