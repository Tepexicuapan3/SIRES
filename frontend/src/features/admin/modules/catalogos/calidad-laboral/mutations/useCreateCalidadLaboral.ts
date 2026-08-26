import { useMutation, useQueryClient } from "@tanstack/react-query";
import { calidadLaboralAPI } from "@api/resources/catalogos/calidadLaboral.api";
import type { CreateCalidadLaboralRequest, CreateCalidadLaboralResponse } from "@api/types";
import { calidadLaboralKeys } from "@features/admin/modules/catalogos/calidad-laboral/queries/calidadLaboral.keys";

interface Payload {
  data: CreateCalidadLaboralRequest;
}

export const useCreateCalidadLaboral = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateCalidadLaboralResponse, Error, Payload>({
    mutationFn: ({ data }) => calidadLaboralAPI.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: calidadLaboralKeys.all });
    },
  });
};
