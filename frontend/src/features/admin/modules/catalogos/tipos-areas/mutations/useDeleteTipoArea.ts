import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposAreasAPI } from "@api/resources/catalogos/tipos-areas.api";
import { tiposAreasKeys } from "@features/admin/modules/catalogos/tipos-areas/queries/tipos-areas.keys";

interface DeleteTipoAreaPayload {
  id: number;
}

export const useDeleteTipoArea = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteTipoAreaPayload) => tiposAreasAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: tiposAreasKeys.list() });
      queryClient.removeQueries({
        queryKey: tiposAreasKeys.detail(variables.id),
      });
    },
  });
};
