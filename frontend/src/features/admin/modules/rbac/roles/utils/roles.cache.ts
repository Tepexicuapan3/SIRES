import type { QueryClient } from "@tanstack/react-query";
import type {
  RoleDetailResponse,
  RoleListItem,
  RolePermission,
  RolesListResponse,
} from "@api/types";
import { rolesKeys } from "@features/admin/modules/rbac/roles/queries/roles.keys";

const updateRoleDetailCache = (
  queryClient: QueryClient,
  roleId: number,
  updater: (current: RoleDetailResponse) => RoleDetailResponse,
) => {
  queryClient.setQueryData<RoleDetailResponse>(
    rolesKeys.detail(roleId),
    (current) => {
      if (!current) return current;
      return updater(current);
    },
  );
};

const updateRolesListCache = (
  queryClient: QueryClient,
  roleId: number,
  updater: (current: RoleListItem) => RoleListItem,
) => {
  queryClient.setQueriesData<RolesListResponse>(
    { queryKey: rolesKeys.list() },
    (current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item) =>
          item.id === roleId ? updater(item) : item,
        ),
      };
    },
  );
};

export const syncRoleDetailCache = (
  queryClient: QueryClient,
  roleId: number,
  role: RoleListItem,
) => {
  updateRoleDetailCache(queryClient, roleId, (current) => ({
    ...current,
    role: {
      ...current.role,
      ...role,
    },
  }));

  updateRolesListCache(queryClient, roleId, (item) => ({
    ...item,
    ...role,
  }));
};

export const syncRolePermissionsCache = (
  queryClient: QueryClient,
  roleId: number,
  permissions: RolePermission[],
) => {
  updateRoleDetailCache(queryClient, roleId, (current) => ({
    ...current,
    permissions,
    role: {
      ...current.role,
      permissionsCount: permissions.length,
    },
  }));

  updateRolesListCache(queryClient, roleId, (item) => ({
    ...item,
    permissionsCount: permissions.length,
  }));
};

export const removeRoleFromCache = (
  queryClient: QueryClient,
  roleId: number,
) => {
  queryClient.setQueriesData<RolesListResponse>(
    { queryKey: rolesKeys.list() },
    (current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.filter((item) => item.id !== roleId),
        total: Math.max(0, current.total - 1),
        totalPages: Math.max(
          1,
          Math.ceil(Math.max(0, current.total - 1) / current.pageSize),
        ),
      };
    },
  );
};
