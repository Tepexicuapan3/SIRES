import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposCitasAPI } from "@api/resources/catalogos/tipos-citas.api";
import type { CreateTipoCitaRequest, CreateTipoCitaResponse } from "@api/types";
import { tiposCitasKeys } from "@features/admin/modules/catalogos/tipos-citas/queries/tipos-citas.keys";

interface Payload {
  data: CreateTipoCitaRequest;
}

export const useCreateTipoCita = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTipoCitaResponse, Error, Payload>({
    mutationFn: ({ data }) => tiposCitasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tiposCitasKeys.all });
    },
  });
};
