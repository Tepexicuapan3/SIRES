import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ocupacionesAPI } from "@api/resources/catalogos/ocupaciones.api";
import type { DeleteOcupacionResponse } from "@api/types";
import { ocupacionesKeys } from "@features/admin/modules/catalogos/ocupaciones/queries/ocupaciones.keys";

interface Payload {
  id: number;
}

export const useDeleteOcupacion = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteOcupacionResponse, Error, Payload>({
    mutationFn: ({ id }) => ocupacionesAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: ocupacionesKeys.all });
      queryClient.removeQueries({
        queryKey: ocupacionesKeys.detail(variables.id),
      });
    },
  });
};
