import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UpdateUserRequest } from "@api/types";
import { syncUserProfileCache } from "@features/admin/modules/rbac/users/utils/users.cache";

interface UpdateUserPayload {
  userId: number;
  data: UpdateUserRequest;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: UpdateUserPayload) =>
      usersAPI.update(userId, data),
    onSuccess: (response) => {
      syncUserProfileCache(queryClient, response.user);
    },
  });
};
