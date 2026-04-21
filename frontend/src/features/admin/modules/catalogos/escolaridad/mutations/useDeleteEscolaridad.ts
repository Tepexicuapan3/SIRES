import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escolaridadAPI } from "@api/resources/catalogos/escolaridad.api";
import type { DeleteEscolaridadResponse } from "@api/types";
import { escolaridadKeys } from "@features/admin/modules/catalogos/escolaridad/queries/escolaridad.keys";

interface Payload {
  id: number;
}

export const useDeleteEscolaridad = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteEscolaridadResponse, Error, Payload>({
    mutationFn: ({ id }) => escolaridadAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: escolaridadKeys.all });
      queryClient.removeQueries({
        queryKey: escolaridadKeys.detail(variables.id),
      });
    },
  });
};
