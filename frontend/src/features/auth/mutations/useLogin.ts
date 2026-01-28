import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import type { LoginRequest } from "@api/types";
import { ApiError, ERROR_CODES } from "@api/utils/errors";
import {
  getAuthErrorMessage,
  loginErrorMessages,
} from "@features/auth/domain/auth.messages";
import { setAuthSession } from "@features/auth/utils/auth-cache";

type LoginMutationVariables = LoginRequest & { rememberMe: boolean };

const getLoginMessage = (code?: string) =>
  getAuthErrorMessage(loginErrorMessages, code);

/**
 * Mutation de login.
 *
 * Razon empresarial:
 * - Centraliza el flujo post-login (session + navegacion).
 * - Evita que cada pantalla gestione su propia sesion.
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rememberMe,
      ...credentials
    }: LoginMutationVariables) => {
      void rememberMe;
      return authAPI.login(credentials);
    },
    onSuccess: (data, variables) => {
      if (variables.rememberMe) {
        localStorage.setItem("saved_username", variables.username);
      } else {
        localStorage.removeItem("saved_username");
      }

      setAuthSession(queryClient, data.user);

      if (data.requiresOnboarding) {
        toast.info("Configuracion inicial requerida", {
          description: "Por favor completa tu perfil para continuar.",
        });
        navigate("/onboarding");
        return;
      }

      toast.success(`Bienvenido, ${data.user.fullName}`, {
        description: "Has iniciado sesion correctamente",
      });

      const landingRoute = data.user.landingRoute || "/dashboard";
      navigate(landingRoute);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          toast.error("Acceso bloqueado temporalmente", {
            description: getLoginMessage(error.code) || error.message,
            duration: 6000,
          });
          return;
        }

        const description =
          getLoginMessage(error.code) ||
          error.message ||
          "Error al iniciar sesion";
        toast.error("Error de autenticacion", { description });
        return;
      }

      toast.error("Error de autenticacion", {
        description: "Error al iniciar sesion",
      });
    },
  });
};
