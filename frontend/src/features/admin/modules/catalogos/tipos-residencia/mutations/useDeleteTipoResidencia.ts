import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposResidenciaAPI } from "@api/resources/catalogos/tipos-residencia.api";
import { tiposResidenciaKeys } from "@features/admin/modules/catalogos/tipos-residencia/queries/tipos-residencia.keys";

interface DeleteTipoResidenciaPayload {
  id: number;
}

export const useDeleteTipoResidencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteTipoResidenciaPayload) => tiposResidenciaAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: tiposResidenciaKeys.list() });
      queryClient.removeQueries({ queryKey: tiposResidenciaKeys.detail(variables.id) });
    },
  });
};
