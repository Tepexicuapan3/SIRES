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
  retry_after?: number; // Segundos de espera (rate limiting)
}

type LoginMutationVariables = LoginRequest & { rememberMe: boolean };

/**
 * Hook para manejar el login de usuario.
 *
 * NOTA DE SEGURIDAD: El rate limiting y bloqueo por intentos fallidos
 * se maneja EXCLUSIVAMENTE en el backend con Redis.
 * El frontend solo muestra los mensajes de error del servidor.
 *
 * @see backend/docs/RATE_LIMITING.md para documentación de implementación
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({ rememberMe, ...credentials }: LoginMutationVariables) => {
      // rememberMe se usa en onSuccess via variables, no aquí
      void rememberMe;
      return authAPI.login(credentials);
    },

    onSuccess: (data, variables) => {
      // Recordarme
      if (variables.rememberMe) {
        localStorage.setItem("saved_username", variables.usuario);
      } else {
        localStorage.removeItem("saved_username");
      }

      // Guardar datos de autenticación en el store
      setAuth(data.user, data.access_token, data.refresh_token);

      // Mostrar mensaje de bienvenida
      toast.success(`¡Bienvenido, ${data.user.nombre}!`, {
        description: "Has iniciado sesión correctamente",
      });

      // Redirigir al dashboard
      navigate("/dashboard");
    },

    onError: (error: AxiosError<LoginError> | Error) => {
      const axiosError = error as AxiosError<LoginError>;
      const errorCode = axiosError.response?.data?.code;
      const errorMessage =
        axiosError.response?.data?.message || "Error al iniciar sesión";
      const retryAfter = axiosError.response?.data?.retry_after;

      // Errores de rate limiting con tiempo de espera
      if (retryAfter && ["TOO_MANY_REQUESTS", "IP_BLOCKED", "USER_LOCKED"].includes(errorCode || "")) {
        const minutes = Math.ceil(retryAfter / 60);
        const timeText = minutes >= 60 
          ? `${Math.floor(minutes / 60)} hora${Math.floor(minutes / 60) > 1 ? 's' : ''}`
          : `${minutes} minuto${minutes > 1 ? 's' : ''}`;

        toast.error("Acceso bloqueado temporalmente", {
          description: `Por seguridad, espera ${timeText} antes de intentar nuevamente.`,
          duration: 6000,
        });

        console.warn(`[Rate Limit] ${errorCode}: retry_after=${retryAfter}s`);
        return;
      }

      // Mensajes personalizados según el código de error del backend
      const messages: Record<string, string> = {
        INVALID_CREDENTIALS: "Usuario o contraseña incorrectos",
        USER_INACTIVE: "Tu usuario está inactivo. Contacta al administrador",
        USER_NOT_FOUND: "El usuario no existe",
        USER_LOCKED: "Cuenta bloqueada temporalmente por seguridad",
        TOO_MANY_REQUESTS: "Demasiados intentos. Espera unos minutos.",
        IP_BLOCKED: "Tu IP ha sido bloqueada temporalmente",
        default: errorMessage,
      };

      toast.error("Error de autenticación", {
        description: messages[errorCode || "default"] || messages.default,
      });

      console.error("Login error:", axiosError);
    },
  });
};
