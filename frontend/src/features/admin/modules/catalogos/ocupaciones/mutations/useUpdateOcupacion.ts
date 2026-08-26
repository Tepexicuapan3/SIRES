import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ocupacionesAPI } from "@api/resources/catalogos/ocupaciones.api";
import type { UpdateOcupacionRequest, UpdateOcupacionResponse } from "@api/types";
import { ocupacionesKeys } from "@features/admin/modules/catalogos/ocupaciones/queries/ocupaciones.keys";

interface Payload {
  id: number;
  data: UpdateOcupacionRequest;
}

export const useUpdateOcupacion = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateOcupacionResponse, Error, Payload>({
    mutationFn: ({ id, data }) => ocupacionesAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(ocupacionesKeys.detail(variables.id), {
        occupation: response.occupation,
      });
      void queryClient.invalidateQueries({ queryKey: ocupacionesKeys.all });
    },
  });
};
