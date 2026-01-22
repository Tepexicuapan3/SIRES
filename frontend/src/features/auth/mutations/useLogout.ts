import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { clearAuthSession } from "@features/auth/utils/auth-cache";

/**
 * Mutation de logout.
 *
 * Razon empresarial:
 * - Limpia cache, store y navegacion en un solo punto.
 * - Evita datos sensibles en cache luego de cerrar sesion.
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authAPI.logout(),
    onSuccess: () => {
      // Asegura limpieza total de datos en memoria.
      queryClient.cancelQueries();
      queryClient.clear();
      clearAuthSession(queryClient);
      navigate("/login");
    },
    onError: (error) => {
      // Incluso con error de red, se fuerza logout local.
      queryClient.cancelQueries();
      queryClient.clear();
      clearAuthSession(queryClient);
      navigate("/login");

      if (import.meta.env.DEV) {
        console.error("Logout error:", error);
      }
    },
  });

  const logoutWithToast = () => {
    // UX unificado para el cierre de sesion.
    toast.promise(mutation.mutateAsync(), {
      loading: "Cerrando sesion...",
      success: "Sesion cerrada correctamente",
      error: "Error al cerrar sesion",
    });
  };

  return {
    ...mutation,
    logoutWithToast,
  };
};
