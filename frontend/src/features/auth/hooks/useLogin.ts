import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { useAuthStore } from "@store/authStore";
import { LoginRequest } from "@api/types/auth.types";
import { AxiosError } from "axios";
import { loginErrorMessages } from "@features/auth/utils/errorMessages";

interface LoginError {
  message: string;
  code?: string;
  retry_after?: number;
}

type LoginMutationVariables = LoginRequest & { rememberMe: boolean };

/**
 * Hook para manejar el login de usuario.
 *
 * NOTA: Los tokens JWT se manejan en HttpOnly cookies (seteadas por el backend).
 * El frontend solo recibe los datos del usuario, NO los tokens.
 *
 * @see backend/docs/RATE_LIMITING.md para documentación de rate limiting
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async ({
      rememberMe,
      ...credentials
    }: LoginMutationVariables) => {
      // rememberMe solo se usa en onSuccess, no en la función de mutación
      void rememberMe;
      return authAPI.login(credentials);
    },

    onSuccess: (data, variables) => {
      // Recordar username (esto SÍ va en localStorage - no es sensible)
      if (variables.rememberMe) {
        localStorage.setItem("saved_username", variables.usuario);
      } else {
        localStorage.removeItem("saved_username");
      }

      // Guardar datos del usuario en el store
      // Los tokens ya están en HttpOnly cookies (seteados por el backend)
      setAuth(data.user);

      // Verificar si requiere onboarding
      if (data.requires_onboarding) {
        toast.info("Configuración inicial requerida", {
          description: "Por favor completa tu perfil para continuar.",
        });
        navigate("/onboarding");
        return;
      }

      // Mensaje de bienvenida
      toast.success(`¡Bienvenido, ${data.user.nombre}!`, {
        description: "Has iniciado sesión correctamente",
      });

      // RBAC 2.0: Redirigir según landing_route del rol
      const landingRoute = data.user.landing_route || "/dashboard";
      navigate(landingRoute);
    },

    onError: (error: AxiosError<LoginError> | Error) => {
      const axiosError = error as AxiosError<LoginError>;
      const errorCode = axiosError.response?.data?.code;
      const errorMessage =
        axiosError.response?.data?.message || "Error al iniciar sesión";
      const retryAfter = axiosError.response?.data?.retry_after;

      // Errores de rate limiting (solo toast informativo)
      if (
        retryAfter &&
        ["TOO_MANY_REQUESTS", "IP_BLOCKED", "USER_LOCKED"].includes(
          errorCode || "",
        )
      ) {
        const minutes = Math.ceil(retryAfter / 60);
        const timeText =
          minutes >= 60
            ? `${Math.floor(minutes / 60)} hora${Math.floor(minutes / 60) > 1 ? "s" : ""}`
            : `${minutes} minuto${minutes > 1 ? "s" : ""}`;

        toast.error("Acceso bloqueado temporalmente", {
          description: `Por seguridad, espera ${timeText} antes de intentar nuevamente.`,
          duration: 6000,
        });

        if (import.meta.env.DEV) {
          console.warn(`[Rate Limit] ${errorCode}: retry_after=${retryAfter}s`);
        }
        return;
      }

      // Usar mensajes centralizados
      const description = errorCode
        ? loginErrorMessages[errorCode] || errorMessage
        : errorMessage;

      toast.error("Error de autenticación", { description });

      if (import.meta.env.DEV) {
        console.error("Login error:", axiosError);
      }
    },
  });
};
