import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposConsultaAPI } from "@api/resources/catalogos/tipos-consulta.api";
import { tiposConsultaKeys } from "@features/admin/modules/catalogos/tipos-consulta/queries/tipos-consulta.keys";

interface DeleteTipoConsultaPayload {
  id: number;
}

export const useDeleteTipoConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteTipoConsultaPayload) => tiposConsultaAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: tiposConsultaKeys.list() });
      queryClient.removeQueries({
        queryKey: tiposConsultaKeys.detail(variables.id),
      });
    },
  });
};
