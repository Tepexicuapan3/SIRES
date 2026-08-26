import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposAutorizacionAPI } from "@api/resources/catalogos/tipos-autorizacion.api";
import type { UpdateTipoAutorizacionRequest, UpdateTipoAutorizacionResponse } from "@api/types";
import { tiposAutorizacionKeys } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/tipos-autorizacion.keys";

interface Payload {
  id: number;
  data: UpdateTipoAutorizacionRequest;
}

export const useUpdateTipoAutorizacion = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateTipoAutorizacionResponse, Error, Payload>({
    mutationFn: ({ id, data }) => tiposAutorizacionAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(tiposAutorizacionKeys.detail(variables.id), {
        authorizationType: response.authorizationType,
      });
      void queryClient.invalidateQueries({ queryKey: tiposAutorizacionKeys.all });
    },
  });
};
