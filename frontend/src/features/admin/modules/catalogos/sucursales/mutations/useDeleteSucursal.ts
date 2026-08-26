import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sucursalesAPI } from "@api/resources/catalogos/sucursales.api";
import { sucursalesKeys } from "@features/admin/modules/catalogos/sucursales/queries/sucursales.keys";

interface Payload {
  id: number;
}

export const useDeleteSucursal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: Payload) => sucursalesAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: sucursalesKeys.all });
      queryClient.removeQueries({
        queryKey: sucursalesKeys.detail(variables.id),
      });
    },
  });
};
