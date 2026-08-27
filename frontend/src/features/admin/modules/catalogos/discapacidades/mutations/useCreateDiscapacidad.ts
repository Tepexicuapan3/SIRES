import { useMutation, useQueryClient } from "@tanstack/react-query";
import { discapacidadesAPI } from "@api/resources/catalogos/discapacidades.api";
import type { CreateDiscapacidadRequest, CreateDiscapacidadResponse } from "@api/types";
import { discapacidadesKeys } from "@features/admin/modules/catalogos/discapacidades/queries/discapacidades.keys";

interface Payload {
  data: CreateDiscapacidadRequest;
}

export const useCreateDiscapacidad = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateDiscapacidadResponse, Error, Payload>({
    mutationFn: ({ data }) => discapacidadesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: discapacidadesKeys.all });
    },
  });
};
