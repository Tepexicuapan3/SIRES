import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import { syncUserStatusCache } from "@/domains/auth-access/adapters/rbac/users/users.cache";

interface ActivateUserPayload {
  userId: number;
}

export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: ActivateUserPayload) => usersAPI.activate(userId),
    onSuccess: (response) => {
      syncUserStatusCache(queryClient, response.id, response.isActive);
    },
  });
};
