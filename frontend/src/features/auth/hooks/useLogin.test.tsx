import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLogin } from "./useLogin";
import { authAPI } from "@api/resources/auth.api";
import { useAuthStore } from "@store/authStore";
import { toast } from "sonner";

// Mock de dependencias
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@api/resources/auth.api", () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

/**
 * Wrapper de providers necesario para testear hooks que usan React Query
 */
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

describe("useLogin", () => {
  beforeEach(() => {
    // Limpiar localStorage y zustand store antes de cada test
    localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Login exitoso - flujo normal", () => {
    it("debería autenticar usuario y redirigir al dashboard", async () => {
      // Arrange: Mock de respuesta exitosa del backend
      const mockUser = {
        id_usuario: 1,
        usuario: "test_user",
        nombre: "Usuario Test",
        roles: ["ROL_MEDICO"],
        must_change_password: false,
      };

      const mockResponse = {
        user: mockUser,
        requires_onboarding: false,
      };

      vi.mocked(authAPI.login).mockResolvedValue(mockResponse);

      // Act: Renderizar hook y ejecutar mutación
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "test_user",
        clave: "password123",
        rememberMe: false,
      });

      // Assert: Verificar que se llamó al API
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(authAPI.login).toHaveBeenCalledWith({
        usuario: "test_user",
        clave: "password123",
      });

      // Verificar que se guardó el usuario en el store
      const storeState = useAuthStore.getState();
      expect(storeState.user).toEqual(mockUser);
      expect(storeState.isAuthenticated).toBe(true);

      // Verificar toast de éxito
      expect(toast.success).toHaveBeenCalledWith(
        `¡Bienvenido, ${mockUser.nombre}!`,
        {
          description: "Has iniciado sesión correctamente",
        },
      );
    });

    it("debería guardar username en localStorage si rememberMe es true", async () => {
      // Arrange
      const mockResponse = {
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Usuario Test",
          roles: ["ROL_MEDICO"],
          must_change_password: false,
        },
        requires_onboarding: false,
      };

      vi.mocked(authAPI.login).mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "test_user",
        clave: "password123",
        rememberMe: true,
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(localStorage.getItem("saved_username")).toBe("test_user");
    });

    it("NO debería guardar username si rememberMe es false", async () => {
      // Arrange
      localStorage.setItem("saved_username", "old_user"); // Usuario previo guardado

      const mockResponse = {
        user: {
          id_usuario: 1,
          usuario: "new_user",
          nombre: "Nuevo Usuario",
          roles: ["ROL_MEDICO"],
          must_change_password: false,
        },
        requires_onboarding: false,
      };

      vi.mocked(authAPI.login).mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "new_user",
        clave: "password123",
        rememberMe: false,
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Debe borrar el username anterior
      expect(localStorage.getItem("saved_username")).toBeNull();
    });
  });

  describe("Flujo de onboarding", () => {
    it("debería redirigir a /onboarding si requires_onboarding es true", async () => {
      // Arrange
      const mockResponse = {
        user: {
          id_usuario: 1,
          usuario: "new_user",
          nombre: "Usuario Nuevo",
          roles: ["ROL_MEDICO"],
          must_change_password: true,
        },
        requires_onboarding: true,
      };

      vi.mocked(authAPI.login).mockResolvedValue(mockResponse);

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "new_user",
        clave: "temporal123",
        rememberMe: false,
      });

      // Assert
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verificar toast informativo de onboarding
      expect(toast.info).toHaveBeenCalledWith(
        "Configuración inicial requerida",
        {
          description: "Por favor completa tu perfil para continuar.",
        },
      );

      // Verificar que el usuario SÍ se guardó en el store (necesario para onboarding)
      const storeState = useAuthStore.getState();
      expect(storeState.user).toEqual(mockResponse.user);
    });
  });

  describe("Manejo de errores", () => {
    it("debería mostrar error genérico si credenciales inválidas", async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            code: "INVALID_CREDENTIALS",
            message: "Usuario o contraseña incorrectos",
          },
          status: 401,
        },
      };

      vi.mocked(authAPI.login).mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "wrong_user",
        clave: "wrong_password",
        rememberMe: false,
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalledWith("Error de autenticación", {
        description: expect.stringContaining("incorrectos"),
      });

      // Verificar que NO se guardó nada en el store
      const storeState = useAuthStore.getState();
      expect(storeState.user).toBeNull();
      expect(storeState.isAuthenticated).toBe(false);
    });

    it("debería manejar rate limiting con retry_after", async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            code: "TOO_MANY_REQUESTS",
            message: "Demasiados intentos",
            retry_after: 300, // 5 minutos
          },
          status: 429,
        },
      };

      vi.mocked(authAPI.login).mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "user",
        clave: "password",
        rememberMe: false,
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalledWith(
        "Acceso bloqueado temporalmente",
        {
          description: expect.stringContaining("5 minuto"),
          duration: 6000,
        },
      );
    });

    it("debería manejar rate limiting con más de 1 hora", async () => {
      // Arrange
      const mockError = {
        response: {
          data: {
            code: "IP_BLOCKED",
            message: "IP bloqueada",
            retry_after: 7200, // 2 horas
          },
          status: 429,
        },
      };

      vi.mocked(authAPI.login).mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "user",
        clave: "password",
        rememberMe: false,
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalledWith(
        "Acceso bloqueado temporalmente",
        {
          description: expect.stringContaining("2 horas"),
          duration: 6000,
        },
      );
    });

    it("debería manejar errores de red sin response", async () => {
      // Arrange
      const mockError = new Error("Network Error");

      vi.mocked(authAPI.login).mockRejectedValue(mockError);

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "user",
        clave: "password",
        rememberMe: false,
      });

      // Assert
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(toast.error).toHaveBeenCalledWith("Error de autenticación", {
        description: "Error al iniciar sesión",
      });
    });
  });

  describe("Estados de loading", () => {
    it("debería tener isPending true mientras ejecuta la mutación", async () => {
      // Arrange
      const mockResponse = {
        user: {
          id_usuario: 1,
          usuario: "test_user",
          nombre: "Usuario Test",
          roles: ["ROL_MEDICO"],
          must_change_password: false,
        },
        requires_onboarding: false,
      };

      // Mock que tarda 100ms en resolver
      vi.mocked(authAPI.login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockResponse), 100),
          ),
      );

      // Act
      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        usuario: "test_user",
        clave: "password123",
        rememberMe: false,
      });

      // Assert: Verificar estado pending inmediatamente después de llamar mutate
      await waitFor(() => expect(result.current.isPending).toBe(true));
      expect(result.current.isSuccess).toBe(false);

      // Esperar resolución
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.isPending).toBe(false);
    });
  });
});
