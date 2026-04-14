import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@/test/utils";
import { LoginPage } from "@/domains/auth-access/pages/LoginPage";
import { authAPI } from "@api/resources/auth.api";
import type { LoginResponse } from "@api/types";
import { ApiError, ERROR_CODES } from "@api/utils/errors";
import { toast } from "sonner";
import { createMockAuthUser } from "@/test/factories/users";

const createLoginResponse = (
  overrides: Parameters<typeof createMockAuthUser>[0] = {},
): LoginResponse => ({
  user: createMockAuthUser(overrides),
  requiresOnboarding: false,
});

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@api/resources/auth.api", () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

vi.mock("@/domains/auth-access/components/shared/ParticlesBackground", () => ({
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
    vi.mocked(authAPI.login).mockResolvedValue(
      createLoginResponse({
        id: 1,
        username: "testuser",
        fullName: "Test User",
        email: "test@metro.cdmx.gob.mx",
        primaryRole: "ADMIN",
        landingRoute: "/dashboard",
        roles: ["ADMIN"],
        permissions: ["*"],
        effectivePermissions: ["*"],
        mustChangePassword: false,
      }),
    );
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

  it("renders updated SISEM branding copy on login", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "SISEM" })).toBeInTheDocument();
    expect(screen.queryByText("S I R E S")).not.toBeInTheDocument();
    expect(
      screen.getByText("Plataforma clínica y administrativa"),
    ).toBeInTheDocument();
  });

  it("logs in successfully and remembers username", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByRole("textbox", { name: /no\. expediente o usuario/i }),
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

    const usernameInput = screen.getByRole("textbox", {
      name: /no\. expediente o usuario/i,
    });
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
      screen.getByRole("textbox", { name: /no\. expediente o usuario/i }),
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

  it("shows the same invalid credentials message for unknown users", async () => {
    vi.mocked(authAPI.login).mockRejectedValueOnce(
      new ApiError(ERROR_CODES.USER_NOT_FOUND, "Usuario no encontrado", 404),
    );

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByRole("textbox", { name: /no\. expediente o usuario/i }),
      "missing_user",
    );
    await user.type(screen.getByLabelText(/^contraseña$/i), "WrongPass1");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Error de autenticacion",
        expect.objectContaining({
          description: "Usuario o contraseña incorrectos",
        }),
      );
    });
  });

  it("disables the submit button while logging in", async () => {
    let resolveLogin: ((value: LoginResponse) => void) | undefined;
    const pendingPromise = new Promise<LoginResponse>((resolve) => {
      resolveLogin = resolve;
    });

    vi.mocked(authAPI.login).mockReturnValueOnce(pendingPromise);

    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(
      screen.getByRole("textbox", { name: /no\. expediente o usuario/i }),
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

    resolveLogin?.(
      createLoginResponse({
        id: 1,
        username: "testuser",
        fullName: "Test User",
        email: "test@metro.cdmx.gob.mx",
        primaryRole: "ADMIN",
        landingRoute: "/dashboard",
        roles: ["ADMIN"],
        permissions: ["*"],
        effectivePermissions: ["*"],
        mustChangePassword: false,
      }),
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
