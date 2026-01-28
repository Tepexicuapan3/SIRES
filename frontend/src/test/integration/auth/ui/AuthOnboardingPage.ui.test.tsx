import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { OnboardingPage } from "@/features/auth/pages/OnboardingPage";
import { authAPI } from "@/api/resources/auth.api";
import { ApiError, ERROR_CODES } from "@/api/utils/errors";
import { toast } from "sonner";

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/features/auth/mutations/useLogout", () => ({
  useLogout: () => ({
    mutate: mockLogout,
    isPending: false,
    logoutWithToast: vi.fn(),
  }),
}));

vi.mock("@/api/resources/auth.api", () => ({
  authAPI: {
    completeOnboarding: vi.fn().mockResolvedValue({
      user: {
        id: 1,
        username: "newuser",
        fullName: "New User",
        email: "new@metro.cdmx.gob.mx",
        primaryRole: "ADMIN",
        landingRoute: "/dashboard",
        roles: ["ADMIN"],
        permissions: ["*"],
        mustChangePassword: false,
      },
      requiresOnboarding: false,
    }),
    logout: vi.fn().mockResolvedValue({ success: true }),
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

describe("Auth UI - OnboardingPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLogout.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(authAPI.completeOnboarding).mockResolvedValue({
      user: {
        id: 1,
        username: "newuser",
        fullName: "New User",
        email: "new@metro.cdmx.gob.mx",
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

  it("completes onboarding flow from terms to password", async () => {
    const user = userEvent.setup();

    render(<OnboardingPage />);

    const continueButton = screen.getByRole("button", {
      name: /continuar al paso de creación de contraseña/i,
    });
    expect(continueButton).toBeDisabled();

    await user.click(
      screen.getByLabelText(/acepto los términos y condiciones/i),
    );
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(await screen.findByText(/crea tu contraseña/i)).toBeVisible();

    await user.type(
      screen.getByLabelText(/nueva contraseña/i),
      "SecurePass123!",
    );
    await user.type(
      screen.getByLabelText(/confirmar contraseña/i),
      "SecurePass123!",
    );

    await user.click(
      screen.getByRole("button", { name: /finalizar y acceder/i }),
    );

    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
          replace: true,
        });
      },
      { timeout: 2000 },
    );
  });

  it("shows an error toast when password is weak", async () => {
    vi.mocked(authAPI.completeOnboarding).mockRejectedValueOnce(
      new ApiError(
        ERROR_CODES.PASSWORD_TOO_WEAK,
        "La contraseña es demasiado débil",
        400,
      ),
    );

    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(
      screen.getByLabelText(/acepto los términos y condiciones/i),
    );
    await user.click(
      screen.getByRole("button", {
        name: /continuar al paso de creación de contraseña/i,
      }),
    );

    await user.type(
      screen.getByLabelText(/nueva contraseña/i),
      "SecurePass123!",
    );
    await user.type(
      screen.getByLabelText(/confirmar contraseña/i),
      "SecurePass123!",
    );

    await user.click(
      screen.getByRole("button", { name: /finalizar y acceder/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error al activar cuenta",
        expect.objectContaining({
          description: "La contraseña es demasiado débil",
        }),
      );
    });
  });

  it("logs out when onboarding session is expired", async () => {
    vi.mocked(authAPI.completeOnboarding).mockRejectedValueOnce(
      new ApiError(ERROR_CODES.TOKEN_EXPIRED, "Sesión expirada", 401),
    );

    const user = userEvent.setup();
    render(<OnboardingPage />);

    await user.click(
      screen.getByLabelText(/acepto los términos y condiciones/i),
    );
    await user.click(
      screen.getByRole("button", {
        name: /continuar al paso de creación de contraseña/i,
      }),
    );

    await user.type(
      screen.getByLabelText(/nueva contraseña/i),
      "SecurePass123!",
    );
    await user.type(
      screen.getByLabelText(/confirmar contraseña/i),
      "SecurePass123!",
    );

    await user.click(
      screen.getByRole("button", { name: /finalizar y acceder/i }),
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Sesión expirada",
        expect.any(Object),
      );
    });

    await waitFor(
      () => {
        expect(mockLogout).toHaveBeenCalled();
      },
      { timeout: 2500 },
    );
  });
});
