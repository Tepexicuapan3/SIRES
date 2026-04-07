import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import type { AssignPermissionsRequest } from "@api/types";
import { syncRolePermissionsCache } from "@/domains/auth-access/adapters/rbac/roles/roles.cache";

interface AssignRolePermissionsPayload {
  data: AssignPermissionsRequest;
}

export const useAssignRolePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: AssignRolePermissionsPayload) =>
      rolesAPI.permissions.assign(data),
    onSuccess: (response) => {
      syncRolePermissionsCache(
        queryClient,
        response.roleId,
        response.permissions,
      );
    },
  });
};
