import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import { syncRolePermissionsCache } from "@features/admin/modules/rbac/roles/utils/roles.cache";

interface RevokeRolePermissionPayload {
  roleId: number;
  permissionId: number;
}

export const useRevokeRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionId }: RevokeRolePermissionPayload) =>
      rolesAPI.permissions.revoke(roleId, permissionId),
    onSuccess: (response) => {
      syncRolePermissionsCache(
        queryClient,
        response.roleId,
        response.permissions,
      );
    },
  });
};
