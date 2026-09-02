import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposConsultaAPI } from "@api/resources/catalogos/tipos-consulta.api";
import type { CreateTipoConsultaRequest, CreateTipoConsultaResponse } from "@api/types";
import { tiposConsultaKeys } from "@features/admin/modules/catalogos/tipos-consulta/queries/tipos-consulta.keys";

interface Payload {
  data: CreateTipoConsultaRequest;
}

export const useCreateTipoConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTipoConsultaResponse, Error, Payload>({
    mutationFn: ({ data }) => tiposConsultaAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tiposConsultaKeys.all });
    },
  });
};
