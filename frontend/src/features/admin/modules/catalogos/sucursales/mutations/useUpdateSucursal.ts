import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sucursalesAPI } from "@api/resources/catalogos/sucursales.api";
import type { UpdateSucursalRequest, UpdateSucursalResponse } from "@api/types";
import { sucursalesKeys } from "@features/admin/modules/catalogos/sucursales/queries/sucursales.keys";

interface Payload {
  id: number;
  data: UpdateSucursalRequest;
}

export const useUpdateSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateSucursalResponse, Error, Payload>({
    mutationFn: ({ id, data }) => sucursalesAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(sucursalesKeys.detail(variables.id), {
        branch: response.branch,
      });
      void queryClient.invalidateQueries({ queryKey: sucursalesKeys.all });
    },
  });
};
