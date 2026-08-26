import { useMutation, useQueryClient } from "@tanstack/react-query";
import { origenConsultaAPI } from "@api/resources/catalogos/origenConsulta.api";
import type { DeleteOrigenConsultaResponse } from "@api/types";
import { origenConsultaKeys } from "@features/admin/modules/catalogos/origen-consulta/queries/origenConsulta.keys";

interface Payload {
  id: string;
}

export const useDeleteOrigenConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteOrigenConsultaResponse, Error, Payload>({
    mutationFn: ({ id }) => origenConsultaAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: origenConsultaKeys.all });
      queryClient.removeQueries({
        queryKey: origenConsultaKeys.detail(variables.id),
      });
    },
  });
};
