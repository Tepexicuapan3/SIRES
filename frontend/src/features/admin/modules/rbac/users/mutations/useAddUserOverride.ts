import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { AddUserOverrideRequest } from "@api/types";
import { syncUserOverridesCache } from "@features/admin/modules/rbac/users/utils/users.cache";

interface AddUserOverridePayload {
  userId: number;
  data: AddUserOverrideRequest;
}

export const useAddUserOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: AddUserOverridePayload) =>
      usersAPI.overrides.add(userId, data),
    onSuccess: (response) => {
      syncUserOverridesCache(queryClient, response.userId, response.overrides);
    },
  });
};
