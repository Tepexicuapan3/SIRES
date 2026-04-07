import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import { removeRoleFromCache } from "@/domains/auth-access/adapters/rbac/roles/roles.cache";

interface DeleteRolePayload {
  roleId: number;
}

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId }: DeleteRolePayload) => rolesAPI.delete(roleId),
    onSuccess: (_response, variables) => {
      removeRoleFromCache(queryClient, variables.roleId);
    },
  });
};
