import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { useAuthStore } from "@store/authStore";

/**
 * Hook para manejar el logout de usuario
 *
 * Usa toast.promise para mostrar estado de carga durante el logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authAPI.logout(),

    onSuccess: () => {
      // Cancelar cualquier query en vuelo y borrar la caché
      queryClient.cancelQueries();
      queryClient.clear();

      // Limpiar store
      logout();

      // Redirigir a login
      navigate("/login");
    },

    onError: (error) => {
      // Incluso si falla la API, limpiar localmente
      queryClient.cancelQueries();
      queryClient.clear();
      logout();
      navigate("/login");

      if (import.meta.env.DEV) {
        console.error("Logout error:", error);
      }
    },
  });

  /**
   * Ejecuta el logout con notificación de progreso
   * Muestra toast de carga → éxito/error automáticamente
   */
  const logoutWithToast = () => {
    toast.promise(mutation.mutateAsync(), {
      loading: "Cerrando sesión...",
      success: "Sesión cerrada correctamente",
      error: "Error al cerrar sesión",
    });
  };

  return {
    ...mutation,
    logoutWithToast,
  };
};
