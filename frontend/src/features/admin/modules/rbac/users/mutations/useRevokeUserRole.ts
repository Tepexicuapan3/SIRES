import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import { syncUserRolesCache } from "@features/admin/modules/rbac/users/utils/users.cache";

interface RevokeUserRolePayload {
  userId: number;
  roleId: number;
}

export const useRevokeUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: RevokeUserRolePayload) =>
      usersAPI.roles.revoke(userId, roleId),
    onSuccess: (response) => {
      syncUserRolesCache(queryClient, response.userId, response.roles);
    },
  });
};
