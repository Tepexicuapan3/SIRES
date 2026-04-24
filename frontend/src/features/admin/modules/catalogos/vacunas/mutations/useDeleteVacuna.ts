import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vacunasAPI } from "@api/resources/catalogos/vacunas.api";
import type { DeleteVacunaResponse } from "@api/types";
import { vacunasKeys } from "@features/admin/modules/catalogos/vacunas/queries/vacunas.keys";

interface Payload {
  vacunaId: number;
}

export const useDeleteVacuna = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteVacunaResponse, Error, Payload>({
    mutationFn: ({ vacunaId }) => vacunasAPI.delete(vacunaId),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: vacunasKeys.all });
      queryClient.removeQueries({
        queryKey: vacunasKeys.detail(variables.vacunaId),
      });
    },
  });
};
