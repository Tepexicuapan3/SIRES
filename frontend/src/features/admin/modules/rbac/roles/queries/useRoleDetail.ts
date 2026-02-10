import { useQuery } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import type { RoleDetailResponse } from "@api/types";
import { rolesKeys } from "@features/admin/modules/rbac/roles/queries/roles.keys";

export const useRoleDetail = (roleId?: number, enabled = true) => {
  return useQuery<RoleDetailResponse>({
    queryKey: roleId ? rolesKeys.detail(roleId) : rolesKeys.detail(0),
    queryFn: () => rolesAPI.getById(roleId ?? 0),
    enabled: Boolean(roleId) && enabled,
    staleTime: 5 * 60 * 1000,
  });
};
