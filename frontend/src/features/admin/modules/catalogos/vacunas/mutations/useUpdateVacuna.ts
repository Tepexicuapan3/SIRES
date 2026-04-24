import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vacunasAPI } from "@api/resources/catalogos/vacunas.api";
import type { UpdateVacunaRequest, UpdateVacunaResponse } from "@api/types";
import { vacunasKeys } from "@features/admin/modules/catalogos/vacunas/queries/vacunas.keys";

interface Payload {
  vacunaId: number;
  data: UpdateVacunaRequest;
}

export const useUpdateVacuna = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateVacunaResponse, Error, Payload>({
    mutationFn: ({ vacunaId, data }) => vacunasAPI.update(vacunaId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(vacunasKeys.detail(variables.vacunaId), {
        vaccine: response.vaccine,
      });
      void queryClient.invalidateQueries({ queryKey: vacunasKeys.all });
    },
  });
};
