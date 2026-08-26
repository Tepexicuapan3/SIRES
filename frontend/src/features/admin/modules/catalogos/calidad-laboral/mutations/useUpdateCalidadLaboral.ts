import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calidadLaboralAPI } from "@api/resources/catalogos/calidadLaboral.api";
import type { UpdateCalidadLaboralRequest, UpdateCalidadLaboralResponse } from "@api/types";
import { calidadLaboralKeys } from "@features/admin/modules/catalogos/calidad-laboral/queries/calidadLaboral.keys";

interface Payload {
  id: string;
  data: UpdateCalidadLaboralRequest;
}

export const useUpdateCalidadLaboral = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateCalidadLaboralResponse, Error, Payload>({
    mutationFn: ({ id, data }) => calidadLaboralAPI.update(id, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(calidadLaboralKeys.detail(variables.id), {
        laborQuality: response.laborQuality,
      });
      void queryClient.invalidateQueries({ queryKey: calidadLaboralKeys.all });
    },
  });
};
