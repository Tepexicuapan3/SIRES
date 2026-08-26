import { useMutation, useQueryClient } from "@tanstack/react-query";
import { licenciasAPI } from "@api/resources/catalogos/licencias.api";
import type { DeleteLicenciaResponse } from "@api/types";
import { licenciasKeys } from "@features/admin/modules/catalogos/licencias/queries/licencias.keys";

interface Payload {
  id: number;
}

export const useDeleteLicencia = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteLicenciaResponse, Error, Payload>({
    mutationFn: ({ id }) => licenciasAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: licenciasKeys.all });
      queryClient.removeQueries({
        queryKey: licenciasKeys.detail(variables.id),
      });
    },
  });
};
