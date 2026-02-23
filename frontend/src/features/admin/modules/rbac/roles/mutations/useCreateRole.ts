import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesAPI } from "@api/resources/roles.api";
import type { CreateRoleRequest } from "@api/types";
import { rolesKeys } from "@features/admin/modules/rbac/roles/queries/roles.keys";

interface CreateRolePayload {
  data: CreateRoleRequest;
}

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: CreateRolePayload) => rolesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
    },
  });
};
