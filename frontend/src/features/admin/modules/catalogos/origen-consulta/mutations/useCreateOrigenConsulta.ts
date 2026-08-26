import { useMutation, useQueryClient } from "@tanstack/react-query";
import { origenConsultaAPI } from "@api/resources/catalogos/origenConsulta.api";
import type { CreateOrigenConsultaRequest, CreateOrigenConsultaResponse } from "@api/types";
import { origenConsultaKeys } from "@features/admin/modules/catalogos/origen-consulta/queries/origenConsulta.keys";

interface Payload {
  data: CreateOrigenConsultaRequest;
}

export const useCreateOrigenConsulta = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateOrigenConsultaResponse, Error, Payload>({
    mutationFn: ({ data }) => origenConsultaAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: origenConsultaKeys.all });
    },
  });
};
