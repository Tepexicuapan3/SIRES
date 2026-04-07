import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { CreateUserRequest } from "@api/types";
import { usersKeys } from "@/domains/auth-access/hooks/rbac/users/users.keys";

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
