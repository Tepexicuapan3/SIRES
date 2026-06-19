import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sucursalesAPI } from "@api/resources/catalogos/sucursales.api";
import type { CreateSucursalRequest, CreateSucursalResponse } from "@api/types";
import { sucursalesKeys } from "@features/admin/modules/catalogos/sucursales/queries/sucursales.keys";

interface Payload {
  data: CreateSucursalRequest;
}

export const useCreateSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateSucursalResponse, Error, Payload>({
    mutationFn: ({ data }) => sucursalesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sucursalesKeys.all });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "catalogos", "branches"],
      });
    },
  });
};
