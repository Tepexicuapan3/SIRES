import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposResidenciaAPI } from "@api/resources/catalogos/tipos-residencia.api";
import type { UpdateTipoResidenciaRequest, UpdateTipoResidenciaResponse } from "@api/types";
import { tiposResidenciaKeys } from "@features/admin/modules/catalogos/tipos-residencia/queries/tipos-residencia.keys";

interface Payload {
  id: number;
  data: UpdateTipoResidenciaRequest;
}

export const useUpdateTipoResidencia = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTipoResidenciaResponse, Error, Payload>({
    mutationFn: ({ id, data }) => tiposResidenciaAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(tiposResidenciaKeys.detail(variables.id), {
        residenceType: response.residenceType,
      });
      void queryClient.invalidateQueries({ queryKey: tiposResidenciaKeys.all });
    },
  });
};
