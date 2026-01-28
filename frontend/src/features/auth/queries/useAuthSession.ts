import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authAPI } from "@api/resources/auth.api";
import { authKeys } from "@features/auth/queries/auth.keys";
import type { AuthUser } from "@api/types";
import { ApiError } from "@api/utils/errors";
import {
  clearAuthSession,
  setAuthSession,
} from "@features/auth/utils/auth-cache";

/**
 * Query de sesion autenticada.
 *
 * Razon empresarial:
 * - Fuente unica de verdad para el usuario autenticado.
 * - Sesion cacheada hace permisos y guards deterministas.
 * - Respuesta no autorizada limpia cache y store para evitar acceso obsoleto.
 */
export const useAuthSession = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const query = useQuery<AuthUser, ApiError>({
    queryKey: authKeys.session(),
    queryFn: () => authAPI.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (!query.data) return;
    // Sincroniza React Query con el store de autenticacion.
    setAuthSession(queryClient, query.data);
  }, [query.data, queryClient]);

  useEffect(() => {
    if (!query.data) return;
    const requiresOnboarding = Boolean(
      query.data.requiresOnboarding ?? query.data.mustChangePassword,
    );

    if (requiresOnboarding && location.pathname !== "/onboarding") {
      navigate("/onboarding", { replace: true });
    }
  }, [location.pathname, navigate, query.data]);

  useEffect(() => {
    if (!query.error) return;
    // Cualquier fallo de auth invalida la sesion local.
    if (query.error.status === 401 || query.error.status === 403) {
      clearAuthSession(queryClient);
    }
  }, [query.error, queryClient]);

  return query;
};
