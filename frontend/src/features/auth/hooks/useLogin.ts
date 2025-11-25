import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { useAuthStore } from "@store/authStore";
import { LoginRequest } from "@api/types/auth.types";
import { AxiosError } from "axios";

interface LoginError {
  message: string;
  code?: string;
}

/**
 * Hook para manejar el login de usuario
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authAPI.login(credentials),

    onSuccess: (data) => {
      // Guardar datos de autenticación en el store
      setAuth(data.user, data.access_token, data.refresh_token);

      // Mostrar mensaje de bienvenida
      toast.success(`¡Bienvenido, ${data.user.nombre}!`, {
        description: "Has iniciado sesión correctamente",
      });

      // Redirigir al dashboard
      navigate("/dashboard");
    },

    onError: (error: AxiosError<LoginError>) => {
      const errorMessage =
        error.response?.data?.message || "Error al iniciar sesión";
      const errorCode = error.response?.data?.code;

      // Mensajes personalizados según el código de error
      const messages: Record<string, string> = {
        INVALID_CREDENTIALS: "Usuario o contraseña incorrectos",
        USER_INACTIVE: "Tu usuario está inactivo. Contacta al administrador",
        USER_NOT_FOUND: "El usuario no existe",
        default: errorMessage,
      };

      toast.error("Error de autenticación", {
        description: messages[errorCode || "default"] || messages.default,
      });

      console.error("Login error:", error);
    },
  });
};
