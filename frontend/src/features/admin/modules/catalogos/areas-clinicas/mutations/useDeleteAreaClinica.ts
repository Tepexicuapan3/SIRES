import { useMutation, useQueryClient } from "@tanstack/react-query";
import { areasClinicasAPI } from "@api/resources/catalogos/areas-clinicas.api";
import type { DeleteAreaClinicaResponse } from "@api/types";
import { areasClinicasKeys } from "@features/admin/modules/catalogos/areas-clinicas/queries/areas-clinicas.keys";

interface Payload {
  id: number;
}

export const useDeleteAreaClinica = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteAreaClinicaResponse, Error, Payload>({
    mutationFn: ({ id }) => areasClinicasAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: areasClinicasKeys.all });
      queryClient.removeQueries({
        queryKey: areasClinicasKeys.detail(variables.id),
      });
    },
  });
};
