import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginForm } from "./LoginForm";
import { authAPI } from "@api/resources/auth.api";

// Mock de authAPI
vi.mock("@api/resources/auth.api", () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

// Mock de sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("LoginForm", () => {
  const mockOnForgotPassword = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Renderizado inicial", () => {
    it("debería renderizar todos los campos del formulario", () => {
      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      // Verificar que existan los campos
      expect(
        screen.getByLabelText(/no\. expediente o usuario/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/recordar mi usuario en este dispositivo/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /iniciar sesión/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /¿olvidaste tu contraseña\?/i }),
      ).toBeInTheDocument();
    });

    it("debería mostrar placeholder correcto en los inputs", () => {
      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByPlaceholderText(/ej\. mperez123/i);
      const claveInput = screen.getByPlaceholderText(/••••••••/);

      expect(usuarioInput).toBeInTheDocument();
      expect(claveInput).toBeInTheDocument();
    });

    it("debería cargar username guardado desde localStorage", () => {
      localStorage.setItem("saved_username", "usuario_guardado");

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const rememberCheckbox = screen.getByLabelText(
        /recordar mi usuario en este dispositivo/i,
      );

      expect(usuarioInput).toHaveValue("usuario_guardado");
      expect(rememberCheckbox).toBeChecked();
    });

    it("NO debería tener username ni checkbox marcado si no hay saved_username", () => {
      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const rememberCheckbox = screen.getByLabelText(
        /recordar mi usuario en este dispositivo/i,
      );

      expect(usuarioInput).toHaveValue("");
      expect(rememberCheckbox).not.toBeChecked();
    });
  });

  describe("Validación de formulario (Zod)", () => {
    it("debería mostrar error si usuario está vacío al submit", async () => {
      const user = userEvent.setup();

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });
      await user.click(submitButton);

      // Esperar a que aparezca el mensaje de error
      await waitFor(() => {
        expect(
          screen.getByText(/el usuario es requerido/i),
        ).toBeInTheDocument();
      });

      // NO debería llamar al hook de login
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("debería mostrar error si contraseña está vacía al submit", async () => {
      const user = userEvent.setup();

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });

      await user.type(usuarioInput, "test_user");
      await user.click(submitButton);

      // Esperar a que aparezca el mensaje de error
      await waitFor(() => {
        expect(
          screen.getByText(/la contraseña es requerida/i),
        ).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("debería mostrar error si usuario contiene caracteres especiales", async () => {
      const user = userEvent.setup();

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const claveInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });

      await user.type(usuarioInput, "usuario@invalido!");
      await user.type(claveInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/solo letras y números/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("debería mostrar error si usuario excede 20 caracteres", async () => {
      const user = userEvent.setup();

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const claveInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });

      await user.type(usuarioInput, "a".repeat(21)); // 21 caracteres
      await user.type(claveInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/máximo 20 caracteres/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe("Interacción de usuario", () => {
    it("debería toggle visibility de password al hacer click en el ojo", async () => {
      const user = userEvent.setup();

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const claveInput = screen.getByLabelText(/contraseña/i);
      const toggleButton = screen.getByRole("button", { name: "" }); // Botón de ojo (sin nombre)

      // Por defecto es type="password"
      expect(claveInput).toHaveAttribute("type", "password");

      // Click en el ojo → muestra password
      await user.click(toggleButton);
      expect(claveInput).toHaveAttribute("type", "text");

      // Click de nuevo → oculta password
      await user.click(toggleButton);
      expect(claveInput).toHaveAttribute("type", "password");
    });

    it("debería marcar/desmarcar checkbox de rememberMe", async () => {
      const user = userEvent.setup();

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const rememberCheckbox = screen.getByLabelText(
        /recordar mi usuario en este dispositivo/i,
      );

      expect(rememberCheckbox).not.toBeChecked();

      await user.click(rememberCheckbox);
      expect(rememberCheckbox).toBeChecked();

      await user.click(rememberCheckbox);
      expect(rememberCheckbox).not.toBeChecked();
    });

    it("debería llamar onForgotPassword al hacer click en el botón", async () => {
      const user = userEvent.setup();

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const forgotButton = screen.getByRole("button", {
        name: /¿olvidaste tu contraseña\?/i,
      });

      await user.click(forgotButton);

      expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe("Submit del formulario", () => {
    it("debería llamar authAPI.login con credenciales correctas", async () => {
      const user = userEvent.setup();

      // Mock de respuesta exitosa
      vi.mocked(authAPI.login).mockResolvedValue({
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_MEDICO"],
          must_change_password: false,
        },
        requires_onboarding: false,
      });

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const claveInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });

      await user.type(usuarioInput, "test_user");
      await user.type(claveInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith({
          usuario: "test_user",
          clave: "password123",
        });
      });
    });

    it("debería guardar username en localStorage si rememberMe está marcado", async () => {
      const user = userEvent.setup();

      vi.mocked(authAPI.login).mockResolvedValue({
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Test User",
          roles: ["ROL_MEDICO"],
          must_change_password: false,
        },
        requires_onboarding: false,
      });

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const claveInput = screen.getByLabelText(/contraseña/i);
      const rememberCheckbox = screen.getByLabelText(
        /recordar mi usuario en este dispositivo/i,
      );
      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });

      await user.type(usuarioInput, "test_user");
      await user.type(claveInput, "password123");
      await user.click(rememberCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalled();
        // Verificar que se guardó el username
        expect(localStorage.getItem("saved_username")).toBe("test_user");
      });
    });

    it("debería limpiar campo password en caso de error", async () => {
      const user = userEvent.setup();

      // Mock de respuesta de error
      vi.mocked(authAPI.login).mockRejectedValue({
        response: {
          data: {
            code: "INVALID_CREDENTIALS",
            message: "Usuario o contraseña incorrectos",
          },
          status: 401,
        },
      });

      render(<LoginForm onForgotPassword={mockOnForgotPassword} />, {
        wrapper: createWrapper(),
      });

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const claveInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });

      await user.type(usuarioInput, "wrong_user");
      await user.type(claveInput, "wrong_password");
      await user.click(submitButton);

      // Esperar a que se llame al API
      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalled();
      });

      // Verificar que el password se limpió (el componente hace setValue("clave", "") en onError)
      await waitFor(() => {
        expect(claveInput).toHaveValue("");
      });
    });
  });

  describe("Estados de loading", () => {
    it("debería mostrar spinner durante submit", async () => {
      const user = userEvent.setup();

      // Mock que tarda un poco en resolver para capturar el estado pending
      vi.mocked(authAPI.login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  user: {
                    id_usuario: 1,
                    usuario: "test_user",
                    nombre: "Test User",
                    roles: ["ROL_MEDICO"],
                    must_change_password: false,
                  },
                  requires_onboarding: false,
                }),
              100,
            ),
          ),
      );

      const { container } = render(
        <LoginForm onForgotPassword={mockOnForgotPassword} />,
        {
          wrapper: createWrapper(),
        },
      );

      const usuarioInput = screen.getByLabelText(/no\. expediente o usuario/i);
      const claveInput = screen.getByLabelText(/contraseña/i);
      const submitButton = screen.getByRole("button", {
        name: /iniciar sesión/i,
      });

      await user.type(usuarioInput, "test_user");
      await user.type(claveInput, "password123");
      await user.click(submitButton);

      // Durante el submit, debe aparecer el spinner
      await waitFor(() => {
        const spinner = container.querySelector(".animate-spin");
        expect(spinner).toBeInTheDocument();
      });

      // Esperar a que termine el submit
      await waitFor(
        () => {
          expect(authAPI.login).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );
    });
  });
});
