import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UsersListParams, UsersListResponse } from "@api/types";
import { usersKeys } from "@features/admin/modules/rbac/users/queries/users.keys";

/**
 * Query de listado de usuarios.
 *
 * Razon empresarial:
 * - Centraliza el acceso al listado RBAC y mantiene cache consistente.
 * - Evita duplicar criterios de paginacion en UI.
 */
export const useUsersList = (params?: UsersListParams) => {
  return useQuery<UsersListResponse>({
    queryKey: usersKeys.list(params),
    queryFn: () => usersAPI.getUsers(params),
    staleTime: 2 * 60 * 1000,
  });
};
