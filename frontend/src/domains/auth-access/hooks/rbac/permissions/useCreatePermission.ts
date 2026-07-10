import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsAPI } from "@api/resources/permissions.api";
import type { CreatePermissionRequest } from "@api/types";
import { permissionsKeys } from "@/domains/auth-access/hooks/rbac/permissions/permissions.keys";

export const useCreatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePermissionRequest) => permissionsAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: permissionsKeys.catalog() });
    },
  });
};
