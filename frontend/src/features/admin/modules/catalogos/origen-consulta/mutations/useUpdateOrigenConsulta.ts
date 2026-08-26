import { useMutation, useQueryClient } from "@tanstack/react-query";
import { origenConsultaAPI } from "@api/resources/catalogos/origenConsulta.api";
import type { UpdateOrigenConsultaRequest, UpdateOrigenConsultaResponse } from "@api/types";
import { origenConsultaKeys } from "@features/admin/modules/catalogos/origen-consulta/queries/origenConsulta.keys";

interface Payload {
  id: string;
  data: UpdateOrigenConsultaRequest;
}

export const useUpdateOrigenConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateOrigenConsultaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => origenConsultaAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(origenConsultaKeys.detail(variables.id), {
        consultationOrigin: response.consultationOrigin,
      });
      void queryClient.invalidateQueries({ queryKey: origenConsultaKeys.all });
    },
  });
};
