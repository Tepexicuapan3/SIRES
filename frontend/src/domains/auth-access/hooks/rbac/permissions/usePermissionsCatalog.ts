import { useQuery } from "@tanstack/react-query";
import { permissionsAPI } from "@api/resources/permissions.api";
import type { PermissionCatalogResponse } from "@api/types/permissions.types";
import { permissionsKeys } from "@/domains/auth-access/hooks/rbac/permissions/permissions.keys";

export const usePermissionsCatalog = (enabled = true) => {
  return useQuery<PermissionCatalogResponse>({
    queryKey: permissionsKeys.catalog(),
    queryFn: () => permissionsAPI.getAll(),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};
