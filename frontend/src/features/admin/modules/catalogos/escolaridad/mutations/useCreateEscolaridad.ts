import { useMutation, useQueryClient } from "@tanstack/react-query";
import { escolaridadAPI } from "@api/resources/catalogos/escolaridad.api";
import type { CreateEscolaridadRequest, CreateEscolaridadResponse } from "@api/types";
import { escolaridadKeys } from "@features/admin/modules/catalogos/escolaridad/queries/escolaridad.keys";

interface Payload {
  data: CreateEscolaridadRequest;
}

export const useCreateEscolaridad = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateEscolaridadResponse, Error, Payload>({
    mutationFn: ({ data }) => escolaridadAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: escolaridadKeys.all });
    },
  });
};
