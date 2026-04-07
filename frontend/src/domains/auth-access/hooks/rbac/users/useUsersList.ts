import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UsersListParams, UsersListResponse } from "@api/types";
import { usersKeys } from "@/domains/auth-access/hooks/rbac/users/users.keys";

interface UseUsersListOptions {
  enabled?: boolean;
}

/**
 * Query de listado de usuarios.
 *
 * Razon empresarial:
 * - Centraliza el acceso al listado RBAC y mantiene cache consistente.
 * - Evita duplicar criterios de paginacion en UI.
 */
export const useUsersList = (
  params?: UsersListParams,
  options: UseUsersListOptions = {},
) => {
  return useQuery<UsersListResponse>({
    queryKey: usersKeys.list(params),
    queryFn: () => usersAPI.getUsers(params),
    staleTime: 2 * 60 * 1000,
    enabled: options.enabled ?? true,
  });
};
