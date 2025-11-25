import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authAPI } from "@api/resources/auth.api";
import { useAuthStore } from "@store/authStore";

/**
 * Hook para manejar el logout de usuario
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => authAPI.logout(),

    onSuccess: () => {
      // Limpiar store
      logout();

      // Mostrar mensaje
      toast.info("Sesión cerrada", {
        description: "Has cerrado sesión correctamente",
      });

      // Redirigir a login
      navigate("/login");
    },

    onError: (error) => {
      // Incluso si falla la API, limpiar localmente
      logout();
      navigate("/login");

      console.error("Logout error:", error);
    },
  });
};
