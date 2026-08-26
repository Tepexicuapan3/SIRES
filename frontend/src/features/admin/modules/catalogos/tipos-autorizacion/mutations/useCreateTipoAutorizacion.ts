import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tiposAutorizacionAPI } from "@api/resources/catalogos/tipos-autorizacion.api";
import type { CreateTipoAutorizacionRequest, CreateTipoAutorizacionResponse } from "@api/types";
import { tiposAutorizacionKeys } from "@features/admin/modules/catalogos/tipos-autorizacion/queries/tipos-autorizacion.keys";

interface Payload {
  data: CreateTipoAutorizacionRequest;
}

export const useCreateTipoAutorizacion = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateTipoAutorizacionResponse, Error, Payload>({
    mutationFn: ({ data }) => tiposAutorizacionAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tiposAutorizacionKeys.all });
    },
  });
};
