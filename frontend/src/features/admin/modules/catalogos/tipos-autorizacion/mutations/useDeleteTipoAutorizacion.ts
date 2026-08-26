import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposAutorizacionAPI } from "@api/resources/catalogos/tipos-autorizacion.api";
import { tiposAutorizacionKeys } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/tipos-autorizacion.keys";

interface Payload {
  id: number;
}

export const useDeleteTipoAutorizacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: Payload) => tiposAutorizacionAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: tiposAutorizacionKeys.all });
      queryClient.removeQueries({
        queryKey: tiposAutorizacionKeys.detail(variables.id),
      });
    },
  });
};
