import { useMutation, useQueryClient } from "@tanstack/react-query";
import { autorizadoresAPI } from "@api/resources/catalogos/autorizadores.api";
import type { CreateAutorizadorRequest, CreateAutorizadorResponse } from "@api/types";
import { autorizadoresKeys } from "@features/admin/modules/catalogos/autorizadores/queries/autorizadores.keys";

interface Payload {
  data: CreateAutorizadorRequest;
}

export const useCreateAutorizador = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateAutorizadorResponse, Error, Payload>({
    mutationFn: ({ data }) => autorizadoresAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: autorizadoresKeys.all });
    },
  });
};
