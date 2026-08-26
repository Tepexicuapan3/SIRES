import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ocupacionesAPI } from "@api/resources/catalogos/ocupaciones.api";
import type { CreateOcupacionRequest, CreateOcupacionResponse } from "@api/types";
import { ocupacionesKeys } from "@features/admin/modules/catalogos/ocupaciones/queries/ocupaciones.keys";

interface Payload {
  data: CreateOcupacionRequest;
}

export const useCreateOcupacion = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateOcupacionResponse, Error, Payload>({
    mutationFn: ({ data }) => ocupacionesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ocupacionesKeys.all });
    },
  });
};
