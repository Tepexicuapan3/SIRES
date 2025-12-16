import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { useAuthStore } from "@store/authStore";
import { LoginRequest } from "@api/types/auth.types";
import { AxiosError } from "axios";
import { useLoginProtectionStore } from "@store/loginProtectionStore";

interface LoginError {
  message: string;
  code?: string;
}

type LoginMutationVariables = LoginRequest & { rememberMe: boolean };

/**
 * Hook para manejar el login de usuario
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { recordFailure, resetProtection, isLocked } =
    useLoginProtectionStore();

  return useMutation({
    mutationFn: async ({
      rememberMe,
      ...credentials
    }: LoginMutationVariables) => {
      // Si el store dice que estamos bloqueados, lanzamos un error local inmediatamente
      if (isLocked()) {
        throw new Error("LOCKED_CLIENT_SIDE");
      }
      return authAPI.login(credentials);
    },

    onSuccess: (data, variables) => {
      // Reiniciamos la protección (volvemos a 0 intentos)
      resetProtection();

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

      // Redirigir al dashbord
      navigate("/dashboard");
    },

    onError: (error: AxiosError<LoginError> | Error) => {
      // Manejo del bloqueo preventivo
      if (error.message === "LOCKED_CLIENT_SIDE") {
        toast.error("Acceso temporalmente bloqueado", {
          description:
            "Has excedido el número de intentos. Por seguridad, espera a que el contador termine.",
        });
        return;
      }

      // Registramos el fallo para aumentar el contador de seguridad
      recordFailure();

      // Casteamos a AxiosError para acceder a la data del servidor
      const axiosError = error as AxiosError<LoginError>;

      const errorMessage =
        axiosError.response?.data?.message || "Error al iniciar sesión";
      const errorCode = axiosError.response?.data?.code;

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

      console.error("Login error:", axiosError);
    },
  });
};
