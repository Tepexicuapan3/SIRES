import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposConsultaAPI } from "@api/resources/catalogos/tipos-consulta.api";
import type { UpdateTipoConsultaRequest, UpdateTipoConsultaResponse } from "@api/types";
import { tiposConsultaKeys } from "@features/admin/modules/catalogos/tipos-consulta/queries/tipos-consulta.keys";

interface Payload {
  id: number;
  data: UpdateTipoConsultaRequest;
}

export const useUpdateTipoConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTipoConsultaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => tiposConsultaAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(tiposConsultaKeys.detail(variables.id), {
        consultationType: response.consultationType,
      });
      void queryClient.invalidateQueries({ queryKey: tiposConsultaKeys.all });
    },
  });
};
