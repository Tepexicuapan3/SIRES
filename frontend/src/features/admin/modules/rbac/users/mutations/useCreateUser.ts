import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { CreateUserRequest } from "@api/types";
import { usersKeys } from "@features/admin/modules/rbac/users/queries/users.keys";

interface CreateUserPayload {
  data: CreateUserRequest;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateUserPayload) => usersAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
};
