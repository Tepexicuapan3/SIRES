import { describe, it, expect, vi, beforeEach } from "vitest";
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
    login: vi.fn().mockResolvedValue({
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

describe("Auth UI - LoginPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    window.localStorage.clear();
    vi.mocked(authAPI.login).mockResolvedValue({
      user: {
        id: 1,
        username: "testuser",
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
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  it("shows validation errors on empty submit", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText(/el usuario es requerido/i)).toBeVisible();
    expect(
      await screen.findByText(/la contraseña es requerida/i),
    ).toBeVisible();
  });

  it("logs in successfully and remembers username", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/no\. expediente o usuario/i),
      "testuser",
    );
    await user.type(screen.getByLabelText(/^contraseña$/i), "password123");
    await user.click(
      screen.getByLabelText(/recordar mi usuario en este dispositivo/i),
    );

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });

    expect(window.localStorage.getItem("saved_username")).toBe("testuser");
  });

  it("prefills the username when remember me is enabled", async () => {
    window.localStorage.setItem("saved_username", "remembered");
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/no\. expediente o usuario/i);
    expect(usernameInput).toHaveValue("remembered");

    const rememberCheckbox = screen.getByRole("checkbox", {
      name: /recordar mi usuario en este dispositivo/i,
    });
    expect(rememberCheckbox).toBeChecked();
  });

  it("shows an error toast for invalid credentials", async () => {
    vi.mocked(authAPI.login).mockRejectedValueOnce(
      new ApiError(
        ERROR_CODES.INVALID_CREDENTIALS,
        "Usuario o contraseña incorrectos",
        401,
      ),
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^contraseña$/i);

    await user.type(
      screen.getByLabelText(/no\. expediente o usuario/i),
      "testuser",
    );
    await user.type(passwordInput, "wrongpass1");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error de autenticacion",
        expect.objectContaining({
          description: "Usuario o contraseña incorrectos",
        }),
      );
    });

    await waitFor(() => {
      expect(passwordInput).toHaveValue("");
      expect(passwordInput).toHaveFocus();
    });
  });

  it("disables the submit button while logging in", async () => {
    let resolveLogin: ((value: unknown) => void) | undefined;
    const pendingPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    vi.mocked(authAPI.login).mockReturnValueOnce(pendingPromise as never);

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/no\. expediente o usuario/i),
      "testuser",
    );
    await user.type(screen.getByLabelText(/^contraseña$/i), "password123");

    const submitButton = screen.getByRole("button", {
      name: /iniciar sesión/i,
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    resolveLogin?.({
      user: {
        id: 1,
        username: "testuser",
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

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
