import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { UpdateUserRequest } from "@api/types";
import { usersKeys } from "@features/admin/modules/rbac/users/queries/users.keys";

interface UpdateUserPayload {
  userId: number;
  data: UpdateUserRequest;
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: UpdateUserPayload) =>
      usersAPI.update(userId, data),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: usersKeys.detail(variables.userId),
      });
      void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
};
