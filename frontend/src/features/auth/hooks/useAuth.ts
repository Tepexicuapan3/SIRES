import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { authAPI } from "@/api/resources/auth.api";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook principal de autenticación
 * Verifica y obtiene el usuario actual
 */
export const useAuth = () => {
  const { user, isAuthenticated, logout, setAuth } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: authAPI.getCurrentUser,
    enabled: isAuthenticated && !!localStorage.getItem("access_token"),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  useEffect(() => {
    // Actualizar usuario en store si cambió
    if (data && JSON.stringify(user) !== JSON.stringify(data)) {
      const token = localStorage.getItem("access_token") || "";
      const refreshToken = localStorage.getItem("refresh_token") || "";
      setAuth(data, token, refreshToken);
    }
  }, [data, user, setAuth]);

  useEffect(() => {
    // Si hay error, hacer logout
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
