import { useMutation, useQueryClient } from "@tanstack/react-query";
import { autorizadoresAPI } from "@api/resources/catalogos/autorizadores.api";
import type { DeleteAutorizadorResponse } from "@api/types";
import { autorizadoresKeys } from "@features/admin/modules/catalogos/autorizadores/queries/autorizadores.keys";

interface Payload {
  id: number;
}

export const useDeleteAutorizador = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteAutorizadorResponse, Error, Payload>({
    mutationFn: ({ id }) => autorizadoresAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: autorizadoresKeys.all });
      queryClient.removeQueries({
        queryKey: autorizadoresKeys.detail(variables.id),
      });
    },
  });
};
