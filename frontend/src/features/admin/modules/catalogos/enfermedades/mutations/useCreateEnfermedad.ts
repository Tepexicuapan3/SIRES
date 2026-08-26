import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enfermedadesAPI } from "@api/resources/catalogos/enfermedades.api";
import type { CreateEnfermedadRequest, CreateEnfermedadResponse } from "@api/types";
import { enfermedadesKeys } from "@features/admin/modules/catalogos/enfermedades/queries/enfermedades.keys";

interface Payload {
  data: CreateEnfermedadRequest;
}

export const useCreateEnfermedad = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateEnfermedadResponse, Error, Payload>({
    mutationFn: ({ data }) => enfermedadesAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: enfermedadesKeys.all });
    },
  });
};
