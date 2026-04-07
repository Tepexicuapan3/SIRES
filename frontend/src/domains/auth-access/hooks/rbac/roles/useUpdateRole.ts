import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import type { UpdateRoleRequest } from "@api/types";
import { syncRoleDetailCache } from "@/domains/auth-access/adapters/rbac/roles/roles.cache";

interface UpdateRolePayload {
  roleId: number;
  data: UpdateRoleRequest;
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: UpdateRolePayload) =>
      rolesAPI.update(roleId, data),
    onSuccess: (response) => {
      syncRoleDetailCache(queryClient, response.role.id, response.role);
    },
  });
};
