import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposResidenciaAPI } from "@api/resources/catalogos/tipos-residencia.api";
import type { CreateTipoResidenciaRequest, CreateTipoResidenciaResponse } from "@api/types";
import { tiposResidenciaKeys } from "@features/admin/modules/catalogos/tipos-residencia/queries/tipos-residencia.keys";

interface Payload {
  data: CreateTipoResidenciaRequest;
}

export const useCreateTipoResidencia = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTipoResidenciaResponse, Error, Payload>({
    mutationFn: ({ data }) => tiposResidenciaAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tiposResidenciaKeys.all });
    },
  });
};
