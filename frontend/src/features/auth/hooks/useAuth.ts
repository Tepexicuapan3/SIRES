import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { authAPI } from "@/api/resources/auth.api";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook principal de autenticación
 * 
 * Verifica si la sesión es válida consultando /auth/me
 * Los tokens están en HttpOnly cookies, el browser los envía automáticamente
 */
export const useAuth = () => {
  const { user, isAuthenticated, logout, setAuth } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: authAPI.getCurrentUser,
    // Solo ejecutar si creemos que estamos autenticados
    // La cookie HttpOnly valida la sesión real
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  useEffect(() => {
    // Actualizar usuario en store si los datos cambiaron
    if (data && JSON.stringify(user) !== JSON.stringify(data)) {
      setAuth(data);
    }
  }, [data, user, setAuth]);

  useEffect(() => {
    // Si hay error de autenticación, hacer logout local
    if (error) {
      logout();
    }
  }, [error, logout]);

  return {
    user: data || user,
    isAuthenticated,
    isLoading,
    error,
    refetch,
  };
};
