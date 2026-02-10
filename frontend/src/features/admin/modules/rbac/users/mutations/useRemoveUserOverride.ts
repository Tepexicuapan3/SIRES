import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import { syncUserOverridesCache } from "@features/admin/modules/rbac/users/utils/users.cache";

interface RemoveUserOverridePayload {
  userId: number;
  permissionCode: string;
}

export const useRemoveUserOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, permissionCode }: RemoveUserOverridePayload) =>
      usersAPI.overrides.remove(userId, permissionCode),
    onSuccess: (response) => {
      syncUserOverridesCache(queryClient, response.userId, response.overrides);
    },
  });
};
