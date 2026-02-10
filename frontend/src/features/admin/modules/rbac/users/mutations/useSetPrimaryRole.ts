import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { SetPrimaryRoleRequest } from "@api/types";
import { syncUserRolesCache } from "@features/admin/modules/rbac/users/utils/users.cache";

interface SetPrimaryRolePayload {
  userId: number;
  data: SetPrimaryRoleRequest;
}

export const useSetPrimaryRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: SetPrimaryRolePayload) =>
      usersAPI.roles.setPrimary(userId, data),
    onSuccess: (response) => {
      syncUserRolesCache(queryClient, response.userId, response.roles);
    },
  });
};
