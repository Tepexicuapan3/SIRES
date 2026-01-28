import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { authAPI } from "@/api/resources/auth.api";
import { ApiError, ERROR_CODES } from "@/api/utils/errors";
import { toast } from "sonner";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/api/resources/auth.api", () => ({
  authAPI: {
    requestResetCode: vi.fn().mockResolvedValue({
      success: true,
      message: "Codigo enviado",
    }),
    verifyResetCode: vi.fn().mockResolvedValue({ valid: true }),
    resetPassword: vi.fn().mockResolvedValue({
      user: {
        id: 1,
        username: "test_user",
        fullName: "Test User",
        email: "test@metro.cdmx.gob.mx",
        primaryRole: "ADMIN",
        landingRoute: "/dashboard",
        roles: ["ADMIN"],
        permissions: ["*"],
        mustChangePassword: false,
      },
      requiresOnboarding: false,
    }),
  },
}));

vi.mock("@/features/auth/animations/ParticlesBackground", () => ({
  ParticlesBackground: () => null,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
  },
}));

describe("Auth UI - Recovery flow", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(authAPI.requestResetCode).mockResolvedValue({
      success: true,
      message: "Codigo enviado",
    });
    vi.mocked(authAPI.verifyResetCode).mockResolvedValue({ valid: true });
    vi.mocked(authAPI.resetPassword).mockResolvedValue({
      user: {
        id: 1,
        username: "test_user",
        fullName: "Test User",
        email: "test@metro.cdmx.gob.mx",
        primaryRole: "ADMIN",
        landingRoute: "/dashboard",
        roles: ["ADMIN"],
        permissions: ["*"],
        mustChangePassword: false,
      },
      requiresOnboarding: false,
    });
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves through request -> OTP -> reset password", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /¿olvidaste tu contraseña\?/i }),
    );

    await user.click(screen.getByRole("button", { name: /enviar código/i }));
    expect(await screen.findByText(/ingresa un correo válido/i)).toBeVisible();

    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      "usuario@metro.cdmx.gob.mx",
    );
    await user.click(screen.getByRole("button", { name: /enviar código/i }));

    const otpInput = await screen.findByLabelText(/dígito 1 de 6/i);
    expect(otpInput).toBeVisible();

    await user.type(otpInput, "123456");

    expect(await screen.findByLabelText(/nueva contraseña/i)).toBeVisible();

    await user.type(
      screen.getByLabelText(/nueva contraseña/i),
      "SecurePass123!",
    );
    await user.type(
      screen.getByLabelText(/confirmar contraseña/i),
      "SecurePass123!",
    );

    await user.click(
      screen.getByRole("button", { name: /restablecer contraseña/i }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
        replace: true,
      });
    });
  });

  it("shows an error toast when email is not found", async () => {
    vi.mocked(authAPI.requestResetCode).mockRejectedValueOnce(
      new ApiError(ERROR_CODES.USER_NOT_FOUND, "Usuario no encontrado", 404),
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /¿olvidaste tu contraseña\?/i }),
    );

    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      "noexiste@metro.cdmx.gob.mx",
    );
    await user.click(screen.getByRole("button", { name: /enviar código/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error",
        expect.objectContaining({
          description: "Usuario no encontrado",
        }),
      );
    });
  });

  it("shows an error toast for invalid OTP codes", async () => {
    vi.mocked(authAPI.verifyResetCode).mockRejectedValueOnce(
      new ApiError("INVALID_CODE", "Código incorrecto", 400),
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", { name: /¿olvidaste tu contraseña\?/i }),
    );
    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      "usuario@metro.cdmx.gob.mx",
    );
    await user.click(screen.getByRole("button", { name: /enviar código/i }));

    const otpInput = await screen.findByLabelText(/dígito 1 de 6/i);
    await user.type(otpInput, "111111");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Código incorrecto",
        expect.any(Object),
      );
    });
  });
});
