import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tipoPersonalAPI } from "@api/resources/catalogos/tipo-personal.api";
import type { DeleteTipoPersonalResponse } from "@api/types";
import { tipoPersonalKeys } from "@features/admin/modules/catalogos/tipo-personal/queries/tipo-personal.keys";

interface Payload {
  id: number;
}

export const useDeleteTipoPersonal = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteTipoPersonalResponse, Error, Payload>({
    mutationFn: ({ id }) => tipoPersonalAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: tipoPersonalKeys.all });
      queryClient.removeQueries({
        queryKey: tipoPersonalKeys.detail(variables.id),
      });
    },
  });
};
