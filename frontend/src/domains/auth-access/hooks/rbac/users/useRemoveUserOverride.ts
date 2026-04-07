import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import { syncUserOverridesCache } from "@/domains/auth-access/adapters/rbac/users/users.cache";

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
