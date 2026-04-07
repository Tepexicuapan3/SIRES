import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@api/resources/users.api";
import type { AssignRolesRequest } from "@api/types";
import { syncUserRolesCache } from "@/domains/auth-access/adapters/rbac/users/users.cache";

interface AssignRolesPayload {
  userId: number;
  data: AssignRolesRequest;
}

export const useAssignRoles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: AssignRolesPayload) =>
      usersAPI.roles.assign(userId, data),
    onSuccess: (response) => {
      syncUserRolesCache(queryClient, response.userId, response.roles);
    },
  });
};
