import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vacunasAPI } from "@api/resources/catalogos/vacunas.api";
import type { CreateVacunaRequest, CreateVacunaResponse } from "@api/types";
import { vacunasKeys } from "@features/admin/modules/catalogos/vacunas/queries/vacunas.keys";

interface Payload {
  data: CreateVacunaRequest;
}

export const useCreateVacuna = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateVacunaResponse, Error, Payload>({
    mutationFn: ({ data }) => vacunasAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: vacunasKeys.all });
    },
  });
};
