import { useMutation, useQueryClient } from "@tanstack/react-query";
import { autorizadoresAPI } from "@api/resources/catalogos/autorizadores.api";
import type { UpdateAutorizadorRequest, UpdateAutorizadorResponse } from "@api/types";
import { autorizadoresKeys } from "@features/admin/modules/catalogos/autorizadores/queries/autorizadores.keys";

interface Payload {
  id: number;
  data: UpdateAutorizadorRequest;
}

export const useUpdateAutorizador = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAutorizadorResponse, Error, Payload>({
    mutationFn: ({ id, data }) => autorizadoresAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(autorizadoresKeys.detail(variables.id), {
        authorizer: response.authorizer,
      });
      void queryClient.invalidateQueries({ queryKey: autorizadoresKeys.all });
    },
  });
};
