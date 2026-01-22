import type { QueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@api/types";
import { authKeys } from "@features/auth/queries/auth.keys";
import { useAuthStore } from "@store/authStore";

/**
 * Sincroniza la sesion entre React Query y el store global.
 *
 * Razon empresarial:
 * - Evita doble fuente de verdad (cache vs store).
 * - Garantiza que guards, UI y permisos lean el mismo usuario.
 */
export const setAuthSession = (
  queryClient: QueryClient,
  user: AuthUser,
) => {
  // Cachea la sesion para uso inmediato en queries.
  queryClient.setQueryData(authKeys.session(), user);
  // Persiste en store para componentes no basados en query.
  useAuthStore.getState().setAuth(user);
};

/**
 * Limpia por completo la sesion local.
 *
 * Razon empresarial:
 * - Protege contra estado obsoleto tras 401/403.
 * - Reduce riesgo de acceso visual con permisos caducados.
 */
export const clearAuthSession = (queryClient: QueryClient) => {
  // Elimina la session cacheada para forzar re-hidratacion.
  queryClient.removeQueries({ queryKey: authKeys.session() });
  // Reinicia el store para bloquear acceso local.
  useAuthStore.getState().logout();
};
