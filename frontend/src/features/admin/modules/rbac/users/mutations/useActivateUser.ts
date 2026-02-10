import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import { usersKeys } from "@features/admin/modules/rbac/users/queries/users.keys";

interface ActivateUserPayload {
  userId: number;
}

export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: ActivateUserPayload) => usersAPI.activate(userId),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({
        queryKey: usersKeys.detail(response.id),
      });
      void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
};
