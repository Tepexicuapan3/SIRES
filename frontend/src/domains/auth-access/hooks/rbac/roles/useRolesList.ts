import { useQuery } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import type { RolesListParams, RolesListResponse } from "@api/types";
import { rolesKeys } from "@/domains/auth-access/hooks/rbac/roles/roles.keys";

interface UseRolesListOptions {
  enabled?: boolean;
}

/**
 * Query de listado de roles.
 *
 * Razon empresarial:
 * - Centraliza el acceso a roles en un punto unico.
 * - Mantiene cache compartida para futuras vistas administrativas.
 */
export const useRolesList = (
  params?: RolesListParams,
  options: UseRolesListOptions = {},
) => {
  return useQuery<RolesListResponse>({
    queryKey: rolesKeys.list(params),
    queryFn: () => rolesAPI.getRoles(params),
    staleTime: 5 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
