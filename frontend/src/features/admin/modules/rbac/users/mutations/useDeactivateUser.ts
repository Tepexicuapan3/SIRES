import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import { syncUserStatusCache } from "@features/admin/modules/rbac/users/utils/users.cache";

interface DeactivateUserPayload {
  userId: number;
}

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: DeactivateUserPayload) =>
      usersAPI.deactivate(userId),
    onSuccess: (response) => {
      syncUserStatusCache(queryClient, response.id, response.isActive);
    },
  });
};
