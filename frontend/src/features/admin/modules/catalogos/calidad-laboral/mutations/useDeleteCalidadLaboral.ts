import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calidadLaboralAPI } from "@api/resources/catalogos/calidadLaboral.api";
import type { DeleteCalidadLaboralResponse } from "@api/types";
import { calidadLaboralKeys } from "@features/admin/modules/catalogos/calidad-laboral/queries/calidadLaboral.keys";

interface Payload {
  id: string;
}

export const useDeleteCalidadLaboral = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteCalidadLaboralResponse, Error, Payload>({
    mutationFn: ({ id }) => calidadLaboralAPI.delete(id),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({ queryKey: calidadLaboralKeys.all });
      queryClient.removeQueries({
        queryKey: calidadLaboralKeys.detail(variables.id),
      });
    },
  });
};
