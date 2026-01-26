import type { QueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@api/types";
import { authKeys } from "@features/auth/queries/auth.keys";

/**
 * Sincroniza la sesion en React Query.
 *
 * Razon empresarial:
 * - Evita doble fuente de verdad.
 * - Garantiza que guards, UI y permisos lean el mismo usuario.
 */
export const setAuthSession = (queryClient: QueryClient, user: AuthUser) => {
  // Cachea la sesion para uso inmediato en queries.
  queryClient.setQueryData(authKeys.session(), user);
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
};
