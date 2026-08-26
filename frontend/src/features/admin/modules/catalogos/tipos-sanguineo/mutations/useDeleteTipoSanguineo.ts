import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposSanguineoAPI } from "@api/resources/catalogos/tipos-sanguineo.api";
import type { DeleteTipoSanguineoResponse } from "@api/types";
import { tiposSanguineoKeys } from "@features/admin/modules/catalogos/tipos-sanguineo/queries/tipos-sanguineo.keys";

interface Payload {
  id: number;
}

export const useDeleteTipoSanguineo = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteTipoSanguineoResponse, Error, Payload>({
    mutationFn: ({ id }) => tiposSanguineoAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: tiposSanguineoKeys.all });
      queryClient.removeQueries({
        queryKey: tiposSanguineoKeys.detail(variables.id),
      });
    },
  });
};
