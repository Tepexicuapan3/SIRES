import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposCitasAPI } from "@api/resources/catalogos/tipos-citas.api";
import { tiposCitasKeys } from "@features/admin/modules/catalogos/tipos-citas/queries/tipos-citas.keys";

interface DeleteTipoCitaPayload {
  id: number;
}

export const useDeleteTipoCita = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeleteTipoCitaPayload) => tiposCitasAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: tiposCitasKeys.list() });
      queryClient.removeQueries({
        queryKey: tiposCitasKeys.detail(variables.id),
      });
    },
  });
};
